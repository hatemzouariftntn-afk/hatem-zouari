import { mongoDB } from './mongodb-db'
import { withCache, cache, CACHE_KEYS } from './cache'
import { Document, Category, Tag } from '@/types'
import { getCurrentUserId } from './auth-helpers'

// Performance-optimized database operations with caching
export class PerformanceDatabase {
  private async getCurrentUserId(): Promise<string | null> {
    return getCurrentUserId()
  }

  // Documents with caching
  async getAllDocuments(): Promise<Document[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    return withCache(
      CACHE_KEYS.DOCUMENTS(userId),
      () => mongoDB.getAllDocuments(),
      2 * 60 * 1000 // 2 minutes cache
    )
  }

  async getDocument(id: string): Promise<Document | null> {
    return mongoDB.getDocument(id)
  }

  async insertDocument(values: Partial<Document>): Promise<Document> {
    const result = await mongoDB.insertDocument(values)
    
    // Clear cache for this user
    const userId = await this.getCurrentUserId()
    if (userId) {
      cache.delete(CACHE_KEYS.DOCUMENTS(userId))
      cache.delete(CACHE_KEYS.TAGS(userId))
    }
    
    return result
  }

  async updateDocument(id: string, values: Partial<Document>): Promise<Document | null> {
    const result = await mongoDB.updateDocument(id, values)
    
    // Clear cache for this user
    const userId = await this.getCurrentUserId()
    if (userId) {
      cache.delete(CACHE_KEYS.DOCUMENTS(userId))
      cache.delete(CACHE_KEYS.TAGS(userId))
    }
    
    return result
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await mongoDB.deleteDocument(id)
    
    // Clear cache for this user
    const userId = await this.getCurrentUserId()
    if (userId) {
      cache.delete(CACHE_KEYS.DOCUMENTS(userId))
      cache.delete(CACHE_KEYS.TAGS(userId))
    }
    
    return result
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    return withCache(
      `${CACHE_KEYS.DOCUMENTS(userId)}:category:${category}`,
      () => mongoDB.getDocumentsByCategory(category),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Categories with caching
  async getAllCategories(): Promise<Category[]> {
    const userId = await this.getCurrentUserId()
    
    return withCache(
      CACHE_KEYS.CATEGORIES(userId || 'anonymous'),
      () => mongoDB.getAllCategories(),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  // Tags with caching
  async getAllTags(): Promise<Tag[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    return withCache(
      CACHE_KEYS.TAGS(userId),
      () => mongoDB.getAllTags(),
      3 * 60 * 1000 // 3 minutes cache
    )
  }

  // Backup operations
  async createBackup(type: 'full' | 'incremental' = 'full'): Promise<void> {
    await mongoDB.createBackup(type)
    
    // Clear cache for this user
    const userId = await this.getCurrentUserId()
    if (userId) {
      cache.delete(CACHE_KEYS.BACKUPS(userId))
    }
  }

  async getBackups() {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    return withCache(
      CACHE_KEYS.BACKUPS(userId),
      () => mongoDB.getBackups(),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  async restoreBackup(backupId: string): Promise<void> {
    await mongoDB.restoreBackup(backupId)
    
    // Clear all cache for this user
    const userId = await this.getCurrentUserId()
    if (userId) {
      cache.delete(CACHE_KEYS.DOCUMENTS(userId))
      cache.delete(CACHE_KEYS.CATEGORIES(userId))
      cache.delete(CACHE_KEYS.TAGS(userId))
      cache.delete(CACHE_KEYS.BACKUPS(userId))
    }
  }

  // Search with optimization
  async searchDocuments(query: string, category?: string): Promise<Document[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const cacheKey = `search:${userId}:${query}:${category || 'all'}`
    
    return withCache(
      cacheKey,
      async () => {
        const documents = await this.getAllDocuments()
        
        return documents.filter(doc => {
          const matchesQuery = !query || 
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.content.toLowerCase().includes(query.toLowerCase()) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          
          const matchesCategory = !category || doc.category === category
          
          return matchesQuery && matchesCategory
        })
      },
      2 * 60 * 1000 // 2 minutes cache
    )
  }

  // Statistics with caching
  async getStatistics() {
    const userId = await this.getCurrentUserId()
    if (!userId) return null

    const cacheKey = `stats:${userId}`
    
    return withCache(
      cacheKey,
      async () => {
        const documents = await this.getAllDocuments()
        const categories = await this.getAllCategories()
        
        const categoryStats = categories.map(cat => ({
          name: cat.name,
          count: documents.filter(doc => doc.category === cat.name).length
        }))
        
        const tagStats = documents
          .flatMap(doc => doc.tags || [])
          .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        
        return {
          totalDocuments: documents.length,
          totalCategories: categories.length,
          totalTags: Object.keys(tagStats).length,
          categoryStats,
          tagStats: Object.entries(tagStats).map(([name, count]) => ({ name, count }))
        }
      },
      5 * 60 * 1000 // 5 minutes cache
    )
  }
}

// Export singleton instance
export const performanceDB = new PerformanceDatabase()
