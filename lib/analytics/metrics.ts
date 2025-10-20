/**
 * Core tracking functions for privacy-compliant analytics
 * Feature: 006-privacy-analytics-dashboard
 *
 * All tracking functions are non-blocking and use atomic Redis operations
 * with Lua scripts to ensure INCR + EXPIRE atomicity.
 */

import { getRedisClient } from "./client";
import { KEY_PATTERNS, TTL_SECONDS, getCurrentDateInAppTimezone } from "./constants";

/**
 * Lua script for atomic increment with TTL
 *
 * Ensures that:
 * 1. Counter is incremented atomically
 * 2. TTL is set only on first write (if key doesn't exist)
 * 3. No race condition between INCR and EXPIRE
 *
 * KEYS[1] = Redis key to increment
 * ARGV[1] = Amount to increment by
 * ARGV[2] = TTL in seconds
 *
 * Returns: New counter value after increment
 */
const INCRBY_WITH_EXPIRE = `
local count = redis.call("INCRBY", KEYS[1], ARGV[1])
if redis.call("TTL", KEYS[1]) < 0 then
    redis.call("EXPIRE", KEYS[1], ARGV[2])
end
return count
`;

/**
 * Track conversation count
 *
 * Increments daily conversation counter by 1.
 * Non-blocking - errors are caught and logged but don't fail the request.
 *
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackConversation(date?: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const key = KEY_PATTERNS.CONVERSATIONS(today);

    await redis.eval(INCRBY_WITH_EXPIRE, [key], [1, TTL_SECONDS.DAILY]);
  } catch (error) {
    console.error("❌ Conversation tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track LLM token usage
 *
 * Increments input and output token counters for a specific model.
 * Uses Promise.all for parallel atomic operations.
 *
 * @param modelName - AI model identifier (e.g., "gemini-2.5-flash")
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens generated
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackTokens(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();

    const inputKey = KEY_PATTERNS.TOKEN_INPUT(modelName, today);
    const outputKey = KEY_PATTERNS.TOKEN_OUTPUT(modelName, today);

    // Parallel atomic operations for better performance
    await Promise.all([
      redis.eval(INCRBY_WITH_EXPIRE, [inputKey], [inputTokens, TTL_SECONDS.DAILY]),
      redis.eval(INCRBY_WITH_EXPIRE, [outputKey], [outputTokens, TTL_SECONDS.DAILY]),
    ]);
  } catch (error) {
    console.error("❌ Token tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track MCP tool call
 *
 * Increments counter for a specific tool invocation.
 * Used for feature adoption metrics.
 *
 * @param toolName - MCP tool identifier (e.g., "get_schedule")
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackToolCall(
  toolName: string,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const key = KEY_PATTERNS.TOOL_CALL(toolName, today);

    await redis.eval(INCRBY_WITH_EXPIRE, [key], [1, TTL_SECONDS.DAILY]);
  } catch (error) {
    console.error("❌ Tool call tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track API response time
 *
 * Records P95 response time for an endpoint.
 * Note: This is a simplified implementation that stores the latest value.
 * For true P95 calculation, consider using Redis sorted sets or streaming percentiles.
 *
 * @param endpoint - API route path (e.g., "/api/hockey-chat")
 * @param durationMs - Response time in milliseconds
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackResponseTime(
  endpoint: string,
  durationMs: number,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const key = KEY_PATTERNS.RESPONSE_TIME_P95(endpoint, today);

    // For MVP: store latest value as approximation
    // Future enhancement: use sorted sets for accurate P95
    await redis.set(key, durationMs, { ex: TTL_SECONDS.DAILY });
  } catch (error) {
    console.error("❌ Response time tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track API error
 *
 * Increments error counter for an endpoint.
 * Used for reliability metrics.
 *
 * @param endpoint - API route path (e.g., "/api/hockey-chat")
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackError(
  endpoint: string,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const key = KEY_PATTERNS.ERROR_COUNT(endpoint, today);

    await redis.eval(INCRBY_WITH_EXPIRE, [key], [1, TTL_SECONDS.DAILY]);
  } catch (error) {
    console.error("❌ Error tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track API success
 *
 * Increments success counter for an endpoint.
 * Used for uptime calculation.
 *
 * @param endpoint - API route path (e.g., "/api/hockey-chat")
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackSuccess(
  endpoint: string,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const key = KEY_PATTERNS.SUCCESS_COUNT(endpoint, today);

    await redis.eval(INCRBY_WITH_EXPIRE, [key], [1, TTL_SECONDS.DAILY]);
  } catch (error) {
    console.error("❌ Success tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}

/**
 * Track external API call
 *
 * Increments call counter for a third-party API (e.g., Google Routes).
 * Used for cost tracking and monitoring.
 *
 * @param apiName - External API identifier (e.g., "google-routes")
 * @param success - Whether the API call succeeded
 * @param date - Date in YYYY-MM-DD format (defaults to today)
 * @returns Promise that resolves when tracking completes
 */
export async function trackExternalApiCall(
  apiName: string,
  success: boolean = true,
  date?: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || getCurrentDateInAppTimezone();
    const callKey = KEY_PATTERNS.EXTERNAL_API_CALL(apiName, today);

    // Track total calls
    await redis.eval(INCRBY_WITH_EXPIRE, [callKey], [1, TTL_SECONDS.DAILY]);

    // Track errors separately if call failed
    if (!success) {
      const errorKey = KEY_PATTERNS.EXTERNAL_API_ERROR(apiName, today);
      await redis.eval(INCRBY_WITH_EXPIRE, [errorKey], [1, TTL_SECONDS.DAILY]);
    }
  } catch (error) {
    console.error("❌ External API tracking failed:", error);
    // Non-blocking: don't throw, just log
  }
}
