/**
 * In-Memory Cache Provider
 * Session-based caching with TTL support
 */

import { CacheProvider, CacheEntry } from '@/types/cache';

/**
 * In-memory cache implementation
 * Data persists only for the server instance lifetime (cold start resets)
 */
export class MemoryCacheProvider<T> implements CacheProvider<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours in ms

  /**
   * Retrieve cached data by key
   * Automatically handles expiration - expired entries are deleted
   */
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    const expiresAt = entry.timestamp + entry.ttl;

    if (now > expiresAt) {
      // Expired - delete and return null
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache with TTL
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Remove specific cache entry
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
