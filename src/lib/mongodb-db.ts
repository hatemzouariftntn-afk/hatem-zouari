import { getCollection, DocumentDocument, CategoryDocument, UserDocument, BackupDocument } from './mongodb'
import { getCurrentUserId } from './auth-helpers'
import { Document, Category, Tag } from '@/types'
import { ObjectId } from 'mongodb'

// MongoDB Database Operations
export class MongoDBDatabase {
  // Get current user ID from session
  private async getCurrentUserId(): Promise<string | null> {
    return await getCurrentUserId()
  }

  // Documents Operations
  async getAllDocuments(): Promise<Document[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const collection = await getCollection<DocumentDocument>('documents')
    const documents = await collection.find({ userId }).sort({ createdAt: -1 }).toArray()
    
    return documents.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      category: doc.category,
      createdAt: Math.floor(doc.createdAt.getTime() / 1000),
      updatedAt: Math.floor(doc.updatedAt.getTime() / 1000),
      mimeType: doc.mimeType || null,
      originalFileName: doc.originalFileName || null
    }))
  }

  async getDocument(id: string): Promise<Document | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) return null

    const collection = await getCollection<DocumentDocument>('documents')
    const doc = await collection.findOne({ _id: new ObjectId(id), userId })
    
    if (!doc) return null
    
    return {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      category: doc.category,
      createdAt: Math.floor(doc.createdAt.getTime() / 1000),
      updatedAt: Math.floor(doc.updatedAt.getTime() / 1000),
      mimeType: doc.mimeType || null,
      originalFileName: doc.originalFileName || null
    }
  }

  async insertDocument(values: Partial<Document>): Promise<Document> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const collection = await getCollection<DocumentDocument>('documents')
    const now = new Date()
    
    const newDocument: Omit<DocumentDocument, '_id'> = {
      title: values.title || '',
      content: values.content || '',
      tags: values.tags || null,
      category: values.category || 'عام',
      userId,
      createdAt: now,
      updatedAt: now,
      mimeType: values.mimeType || null,
      originalFileName: values.originalFileName || null
    }

    const result = await collection.insertOne(newDocument as DocumentDocument)
    const insertedDoc = await collection.findOne({ _id: result.insertedId })
    
    if (!insertedDoc) throw new Error('Failed to insert document')
    
    return {
      id: insertedDoc._id.toString(),
      title: insertedDoc.title,
      content: insertedDoc.content,
      tags: insertedDoc.tags,
      category: insertedDoc.category,
      createdAt: Math.floor(insertedDoc.createdAt.getTime() / 1000),
      updatedAt: Math.floor(insertedDoc.updatedAt.getTime() / 1000),
      mimeType: insertedDoc.mimeType || null,
      originalFileName: insertedDoc.originalFileName || null
    }
  }

  async updateDocument(id: string, values: Partial<Document>): Promise<Document | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) return null

    const collection = await getCollection<DocumentDocument>('documents')
    const now = new Date()
    
    const updateData: Partial<DocumentDocument> = {
      title: values.title,
      content: values.content,
      tags: values.tags,
      category: values.category,
      mimeType: values.mimeType,
      originalFileName: values.originalFileName,
      updatedAt: now
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result.value) return null
    
    return {
      id: result.value._id.toString(),
      title: result.value.title,
      content: result.value.content,
      tags: result.value.tags,
      category: result.value.category,
      createdAt: Math.floor(result.value.createdAt.getTime() / 1000),
      updatedAt: Math.floor(result.value.updatedAt.getTime() / 1000),
      mimeType: result.value.mimeType || null,
      originalFileName: result.value.originalFileName || null
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) return false

    const collection = await getCollection<DocumentDocument>('documents')
    const result = await collection.deleteOne({ _id: new ObjectId(id), userId })
    
    return result.deletedCount > 0
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const collection = await getCollection<DocumentDocument>('documents')
    const documents = await collection.find({ userId, category }).sort({ createdAt: -1 }).toArray()
    
    return documents.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      category: doc.category,
      createdAt: Math.floor(doc.createdAt.getTime() / 1000),
      updatedAt: Math.floor(doc.updatedAt.getTime() / 1000),
      mimeType: doc.mimeType || null,
      originalFileName: doc.originalFileName || null
    }))
  }

  // Categories Operations
  async getAllCategories(): Promise<Category[]> {
    const userId = await this.getCurrentUserId()
    console.log('🔍 getCurrentUserId result:', userId)
    
    const collection = await getCollection<CategoryDocument>('categories')
    
    // First, ensure default categories exist for this user
    if (userId) {
      console.log('📝 Ensuring default categories for user:', userId)
      await this.ensureDefaultCategories(userId)
    } else {
      console.log('⚠️ No user ID found, skipping default categories')
    }
    
    const categories = await collection.find({
      $or: [
        { userId: userId },
        { userId: null }
      ]
    }).sort({ name: 1 }).toArray()
    
    console.log('📂 Raw categories from MongoDB:', categories)
    
    const result = categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      user_id: cat.userId || null
    }))
    
    console.log('✅ Final categories result:', result)
    return result
  }

  // Helper method to ensure default categories exist
  private async ensureDefaultCategories(userId: string | null) {
    if (!userId) return
    
    const collection = await getCollection<CategoryDocument>('categories')
    
    const defaultCategories = [
      "عام", "فواتير", "عقود", "مستندات شخصية", "الوزارة", 
      "النوادي", "اللجنة الاولمبية", "المسابقات", 
      "الحي الوطني الرياضي", "شكاوي", "الادارة", "ملاحظات"
    ]
    
    for (const catName of defaultCategories) {
      const existing = await collection.findOne({ name: catName, userId })
      if (!existing) {
        await collection.insertOne({
          name: catName,
          userId,
          createdAt: new Date()
        })
      }
    }
  }

  // Tags Operations (extracted from documents)
  async getAllTags(): Promise<Tag[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const collection = await getCollection<DocumentDocument>('documents')
    const documents = await collection.find({ userId, tags: { $ne: null, $exists: true } }).toArray()
    
    const allTags = documents
      .flatMap(doc => doc.tags || [])
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
    
    return allTags.map((tag, index) => ({
      id: index + 1,
      name: tag
    }))
  }

  // Backup Operations
  async createBackup(type: 'full' | 'incremental' = 'full'): Promise<void> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const documents = await this.getAllDocuments()
    const categories = await this.getAllCategories()
    
    const backupData = {
      documents,
      categories,
      timestamp: new Date(),
      version: '1.0'
    }

    const collection = await getCollection<BackupDocument>('backups')
    await collection.insertOne({
      userId,
      data: backupData,
      backupType: type,
      createdAt: new Date(),
      size: JSON.stringify(backupData).length
    })
  }

  async getBackups(): Promise<BackupDocument[]> {
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    const collection = await getCollection<BackupDocument>('backups')
    return collection.find({ userId }).sort({ createdAt: -1 }).toArray()
  }

  async restoreBackup(backupId: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const backupCollection = await getCollection<BackupDocument>('backups')
    const backup = await backupCollection.findOne({ _id: new ObjectId(backupId), userId })
    
    if (!backup) throw new Error('Backup not found')

    const { documents, categories } = backup.data

    // Restore documents
    const documentsCollection = await getCollection<DocumentDocument>('documents')
    for (const doc of documents) {
      await documentsCollection.replaceOne(
        { _id: new ObjectId(doc.id), userId },
        {
          title: doc.title,
          content: doc.content,
          tags: doc.tags,
          category: doc.category,
          userId,
          createdAt: new Date(doc.createdAt * 1000),
          updatedAt: new Date(doc.updatedAt * 1000),
          mimeType: doc.mimeType,
          originalFileName: doc.originalFileName
        },
        { upsert: true }
      )
    }

    // Restore categories
    const categoriesCollection = await getCollection<CategoryDocument>('categories')
    for (const cat of categories) {
      await categoriesCollection.replaceOne(
        { _id: new ObjectId(cat.id), userId },
        {
          name: cat.name,
          userId: cat.user_id,
          createdAt: new Date()
        },
        { upsert: true }
      )
    }
  }
}

// Export singleton instance
export const mongoDB = new MongoDBDatabase()
