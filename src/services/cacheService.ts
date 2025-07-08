// services/cacheService.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string; // For cache invalidation when data structure changes
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  version: string;
}

// Cache configurations for different data types
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  userRelationships: { ttl: 5 * 60 * 1000, version: '1.0' }, // 5 minutes
  teamLabs: { ttl: 2 * 60 * 1000, version: '1.0' }, // 2 minutes
  extendedUserData: { ttl: 10 * 60 * 1000, version: '1.0' }, // 10 minutes
  workspace: { ttl: 10 * 60 * 1000, version: '1.0' }, // 10 minutes
  whiteboard: { ttl: 5 * 60 * 1000, version: '1.0' }, // 5 minutes
};

class CacheService {
  private keyPrefix = 'futurity_cache_';

  private getKey(type: string, identifier?: string): string {
    return `${this.keyPrefix}${type}${identifier ? `_${identifier}` : ''}`;
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(type: string, data: T, identifier?: string): void {
    try {
      const config = CACHE_CONFIGS[type];
      if (!config) {
        console.warn(`No cache config found for type: ${type}`);
        return;
      }

      const now = Date.now();
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + config.ttl,
        version: config.version,
      };

      const key = this.getKey(type, identifier);
      localStorage.setItem(key, JSON.stringify(cacheItem));

      console.log(
        `✅ Cached ${type}${identifier ? ` (${identifier})` : ''} for ${
          config.ttl
        }ms`
      );
    } catch (error) {
      console.error('Cache set error:', error);
      // If localStorage is full, try to clear some old entries
      this.clearExpired();
    }
  }

  /**
   * Get data from cache if valid
   */
  get<T>(type: string, identifier?: string): T | null {
    try {
      const config = CACHE_CONFIGS[type];
      if (!config) {
        console.warn(`No cache config found for type: ${type}`);
        return null;
      }

      const key = this.getKey(type, identifier);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now > cacheItem.expiresAt) {
        console.log(
          `⏰ Cache expired for ${type}${identifier ? ` (${identifier})` : ''}`
        );
        localStorage.removeItem(key);
        return null;
      }

      // Check if cache version is outdated
      if (cacheItem.version !== config.version) {
        console.log(
          `🔄 Cache version outdated for ${type}${
            identifier ? ` (${identifier})` : ''
          }`
        );
        localStorage.removeItem(key);
        return null;
      }

      console.log(
        `💾 Cache hit for ${type}${identifier ? ` (${identifier})` : ''}`
      );
      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(type: string, identifier?: string): boolean {
    return this.get(type, identifier) !== null;
  }

  /**
   * Remove specific cache entry
   */
  remove(type: string, identifier?: string): void {
    try {
      const key = this.getKey(type, identifier);
      localStorage.removeItem(key);
      console.log(
        `🗑️ Removed cache for ${type}${identifier ? ` (${identifier})` : ''}`
      );
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpired(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Iterate through all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheItem: CacheItem<any> = JSON.parse(cached);
              if (now > cacheItem.expiresAt) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse the cache item, remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleared ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Cache clearExpired error:', error);
    }
  }

  /**
   * Clear all cache entries for a specific type
   */
  clearType(type: string): void {
    try {
      const keysToRemove: string[] = [];
      const typePrefix = this.getKey(type);

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(typePrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log(
        `🗑️ Cleared all ${type} cache entries (${keysToRemove.length} items)`
      );
    } catch (error) {
      console.error('Cache clearType error:', error);
    }
  }

  /**
   * Clear all Futurity cache entries
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log(
        `🗑️ Cleared all cache entries (${keysToRemove.length} items)`
      );
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    totalSize: number;
    entriesByType: Record<string, number>;
  } {
    const stats = {
      totalEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      entriesByType: {} as Record<string, number>,
    };

    try {
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            stats.totalEntries++;
            stats.totalSize += value.length;

            // Extract type from key
            const type = key.replace(this.keyPrefix, '').split('_')[0];
            stats.entriesByType[type] = (stats.entriesByType[type] || 0) + 1;

            try {
              const cacheItem: CacheItem<any> = JSON.parse(value);
              if (now > cacheItem.expiresAt) {
                stats.expiredEntries++;
              }
            } catch (error) {
              stats.expiredEntries++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Cache getStats error:', error);
    }

    return stats;
  }

  /**
   * Initialize cache service (clear expired entries on startup)
   */
  init(): void {
    console.log('🚀 Initializing cache service...');
    this.clearExpired();

    const stats = this.getStats();
    console.log('📊 Cache stats:', stats);
  }
}

export const cacheService = new CacheService();

// Helper function to create cache-aware data fetchers
export function createCachedFetcher<T>(
  cacheType: string,
  fetcher: () => Promise<T>,
  identifier?: string
) {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = cacheService.get<T>(cacheType, identifier);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch from API
    console.log(
      `🌐 Cache miss for ${cacheType}${
        identifier ? ` (${identifier})` : ''
      }, fetching from API...`
    );
    const data = await fetcher();

    // Store in cache
    cacheService.set(cacheType, data, identifier);

    return data;
  };
}

// Helper function for cache invalidation on data mutations
export function invalidateCache(type: string, identifier?: string): void {
  cacheService.remove(type, identifier);
}

// Helper function to invalidate related caches when data changes
export function invalidateRelatedCaches(
  changedType: string,
  teamId?: string,
  userId?: string
): void {
  switch (changedType) {
    case 'teamMembership':
      // When team membership changes, invalidate user relationships and team labs
      if (userId) {
        cacheService.remove('userRelationships', userId);
      }
      if (teamId) {
        cacheService.remove('teamLabs', teamId);
      }
      break;

    case 'labCreated':
    case 'labDeleted':
    case 'labUpdated':
      // When labs change, invalidate team labs cache
      if (teamId) {
        cacheService.remove('teamLabs', teamId);
      }
      break;

    case 'userProfileUpdated':
      // When user profile changes, invalidate extended user data
      if (userId) {
        cacheService.remove('extendedUserData', userId);
      }
      break;

    case 'whiteboardUpdated':
      // When whiteboard changes, invalidate whiteboard cache
      if (userId) {
        cacheService.remove('whiteboard', userId);
      }
      break;
  }
}
