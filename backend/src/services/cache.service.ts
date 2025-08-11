interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 60000; // 1 minute default TTL

  // Set a cache entry
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, entry);
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
  }

  // Get a cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`🗑️ Cache expired: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return entry.data as T;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete a cache entry
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cache cleared: ${size} entries removed`);
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    this.cache.forEach((entry) => {
      if (now - entry.timestamp <= entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      // Rough estimate of memory size
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      approximateSizeBytes: totalSize
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  // Start automatic cleanup interval
  startAutoCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  tickerHistory: (symbol: string, days: number) => `history:${symbol}:${days}`,
  ticker: (symbol: string) => `ticker:${symbol}`,
  allTickers: () => 'tickers:all',
  userAlerts: (userId: string) => `alerts:user:${userId}`,
  marketStatus: () => 'market:status'
};