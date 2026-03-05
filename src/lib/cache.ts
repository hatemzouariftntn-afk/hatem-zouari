// Simple in-memory cache with TTL
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    })
  }
}

export const cache = new MemoryCache()

// Auto cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000)

// Cache wrapper for async functions
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = cache.get<T>(key)
      if (cached !== null) {
        resolve(cached)
        return
      }

      // Execute function and cache result
      const result = await fn()
      cache.set(key, result, ttl)
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

// Cache keys
export const CACHE_KEYS = {
  DOCUMENTS: (userId: string) => `documents:${userId}`,
  CATEGORIES: (userId: string) => `categories:${userId}`,
  TAGS: (userId: string) => `tags:${userId}`,
  BACKUPS: (userId: string) => `backups:${userId}`
}
