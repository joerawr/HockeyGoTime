/**
 * Cache Provider Types
 * Abstract cache layer for in-memory and Supabase implementations
 */

/**
 * Cache Provider Interface
 * Enables seamless migration from in-memory (P1) to Supabase (P2)
 */
export interface CacheProvider<T> {
  /**
   * Retrieve cached data by key
   * @param key Cache key (e.g., "schedule:2025/2026:14U-B:jr-kings-1")
   * @returns Cached data or null if not found or expired
   */
  get(key: string): Promise<T | null>;

  /**
   * Store data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds (default: 24 hours)
   */
  set(key: string, data: T, ttl?: number): Promise<void>;

  /**
   * Remove specific cache entry
   * @param key Cache key to remove
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Check if key exists and is not expired
   * @param key Cache key
   * @returns true if key exists and valid
   */
  has(key: string): Promise<boolean>;
}

/**
 * Cache Entry
 * Internal structure for cache storage
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
