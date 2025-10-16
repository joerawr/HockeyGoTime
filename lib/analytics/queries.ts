/**
 * Redis query functions for analytics dashboard
 * Feature: 006-privacy-analytics-dashboard
 *
 * Retrieves aggregate metrics from Redis for visualization
 */

import { getRedisClient } from "./client";
import { KEY_PATTERNS, MODEL_PRICING, EXTERNAL_API_PRICING, type SupportedModel } from "./constants";
import { generateDateRange } from "./cost";

/**
 * Get conversation counts for a date range
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of daily conversation counts
 */
export async function getConversationCounts(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; count: number }>> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  // Build Redis keys for all dates
  const keys = dates.map((date) => KEY_PATTERNS.CONVERSATIONS(date));

  // Fetch all counts in parallel
  const counts = await redis.mget(...keys);

  // Map to response format
  return dates.map((date, index) => ({
    date,
    count: typeof counts[index] === "number" ? counts[index] : 0,
  }));
}

/**
 * Get token usage for a date range and model
 *
 * @param modelName - AI model identifier
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of daily token usage (input + output)
 */
export async function getTokenUsage(
  modelName: SupportedModel,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; input: number; output: number }>> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  // Build Redis keys for all dates
  const inputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_INPUT(modelName, date));
  const outputKeys = dates.map((date) =>
    KEY_PATTERNS.TOKEN_OUTPUT(modelName, date)
  );

  // Fetch all counts in parallel
  const [inputCounts, outputCounts] = await Promise.all([
    redis.mget(...inputKeys),
    redis.mget(...outputKeys),
  ]);

  // Map to response format
  return dates.map((date, index) => ({
    date,
    input:
      typeof inputCounts[index] === "number" ? inputCounts[index] : 0,
    output:
      typeof outputCounts[index] === "number" ? outputCounts[index] : 0,
  }));
}

/**
 * Get tool call counts for a date range
 *
 * Returns breakdown by tool name with counts per day.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Object mapping tool names to daily counts
 */
export async function getToolCallCounts(
  startDate: string,
  endDate: string
): Promise<Record<string, Array<{ date: string; count: number }>>> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  // First, scan for all tool names that have data
  // We'll use a pattern to find all tool keys for the date range
  const allKeys: string[] = [];
  let cursor: number | string = 0;

  do {
    const scanResult = await redis.scan(cursor, {
      match: "analytics:tools:*",
      count: 100,
    });
    const [nextCursor, keys] = scanResult as [number | string, string[]];
    allKeys.push(...keys);
    cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;
  } while (cursor !== 0);

  // Extract unique tool names from keys
  const toolNames = new Set<string>();
  for (const key of allKeys) {
    // Key format: analytics:tools:<tool_name>:daily:<date>
    const parts = key.split(":");
    if (parts.length >= 4) {
      toolNames.add(parts[2]);
    }
  }

  // Fetch counts for each tool across the date range
  const result: Record<string, Array<{ date: string; count: number }>> = {};

  for (const toolName of toolNames) {
    const keys = dates.map((date) => KEY_PATTERNS.TOOL_CALL(toolName, date));
    const counts = await redis.mget(...keys);

    result[toolName] = dates.map((date, index) => ({
      date,
      count: typeof counts[index] === "number" ? counts[index] : 0,
    }));
  }

  return result;
}

/**
 * Get tool call breakdown (total counts and percentages)
 *
 * Aggregates tool usage across date range and calculates percentages.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of tools with counts and percentages
 */
export async function getToolBreakdown(
  startDate: string,
  endDate: string
): Promise<
  Array<{ toolName: string; count: number; percentage: number }>
> {
  const toolCounts = await getToolCallCounts(startDate, endDate);

  // Sum up totals for each tool
  const totals: Record<string, number> = {};
  let grandTotal = 0;

  for (const [toolName, dailyCounts] of Object.entries(toolCounts)) {
    const toolTotal = dailyCounts.reduce((sum, day) => sum + day.count, 0);
    totals[toolName] = toolTotal;
    grandTotal += toolTotal;
  }

  // Calculate percentages
  const breakdown = Object.entries(totals)
    .map(([toolName, count]) => ({
      toolName,
      count,
      percentage: grandTotal > 0 ? (count / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return breakdown;
}

/**
 * Get external API call counts and costs
 *
 * Returns total calls and estimated costs for external APIs (e.g., Google Routes).
 *
 * @param apiName - External API identifier (e.g., "google-routes")
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Object with call counts and cost breakdown
 */
export async function getExternalApiCosts(
  apiName: "google-routes",
  startDate: string,
  endDate: string
): Promise<{
  totalCalls: number;
  totalErrors: number;
  successRate: number;
  totalCost: number;
  dailyAverage: number;
}> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  // Build Redis keys for all dates
  const callKeys = dates.map((date) => KEY_PATTERNS.EXTERNAL_API_CALL(apiName, date));
  const errorKeys = dates.map((date) => KEY_PATTERNS.EXTERNAL_API_ERROR(apiName, date));

  // Fetch all counts in parallel
  const [callCounts, errorCounts] = await Promise.all([
    redis.mget(...callKeys),
    redis.mget(...errorKeys),
  ]);

  // Sum up totals
  const totalCalls = (callCounts as Array<number | null>).reduce<number>(
    (sum, count) => sum + (typeof count === "number" ? count : 0),
    0
  );
  const totalErrors = (errorCounts as Array<number | null>).reduce<number>(
    (sum, count) => sum + (typeof count === "number" ? count : 0),
    0
  );

  // Calculate success rate
  const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100;

  // Calculate costs
  const pricing = EXTERNAL_API_PRICING[apiName];
  const totalCost = totalCalls * pricing.costPerCall;
  const dailyAverage = totalCost / dates.length;

  return {
    totalCalls,
    totalErrors,
    successRate,
    totalCost,
    dailyAverage,
  };
}

/**
 * Get all metrics for a date range
 *
 * Convenience function that fetches all metrics in parallel.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param modelName - AI model identifier (defaults to gemini-2.5-flash)
 * @returns Object with conversations, tokens, and tools metrics
 */
export async function getAllMetrics(
  startDate: string,
  endDate: string,
  modelName: SupportedModel = "gemini-2.5-flash"
): Promise<{
  conversations: Array<{ date: string; count: number }>;
  tokens: Array<{ date: string; input: number; output: number }>;
  tools: Record<string, Array<{ date: string; count: number }>>;
}> {
  const [conversations, tokens, tools] = await Promise.all([
    getConversationCounts(startDate, endDate),
    getTokenUsage(modelName, startDate, endDate),
    getToolCallCounts(startDate, endDate),
  ]);

  return {
    conversations,
    tokens,
    tools,
  };
}
