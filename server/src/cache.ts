/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Graceful shutdown function
export function shutdownCache(): void {
  cache.destroy();
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  HOUSECALL_PRO_API: 30,        // 30 seconds for API calls
  GOOGLE_REVIEWS: 300,           // 5 minutes
  SERVICE_LIST: 3600,            // 1 hour
  CAPACITY: 60,                  // 1 minute
  BLOG_POSTS: 300,               // 5 minutes server-side
  HEATMAP: 600,                  // 10 minutes
} as const;
