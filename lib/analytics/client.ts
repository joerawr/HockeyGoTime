/**
 * Upstash Redis client singleton for analytics system
 * Feature: 006-privacy-analytics-dashboard
 *
 * Uses HTTP/REST transport (serverless-native)
 * Free tier: 500K commands/month
 */

import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

/**
 * Get or create Redis client singleton
 *
 * Ensures single connection is reused across serverless function invocations.
 * Throws error if credentials are missing (fail fast).
 *
 * @returns Redis client instance
 * @throws Error if UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing Upstash Redis credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local"
      );
    }

    redisClient = new Redis({
      url,
      token,
    });

    console.log("✅ Upstash Redis client initialized");
  }

  return redisClient;
}

/**
 * Reset Redis client (for testing only)
 *
 * Forces creation of new client on next getRedisClient() call.
 * Use in test cleanup to prevent connection leaks.
 */
export function resetRedisClient(): void {
  redisClient = null;
}
