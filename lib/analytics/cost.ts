/**
 * Cost calculation utilities for analytics dashboard
 * Feature: 006-privacy-analytics-dashboard
 *
 * Calculates LLM API costs based on token usage and model pricing
 */

import { getRedisClient } from "./client";
import { KEY_PATTERNS, MODEL_PRICING, getCurrentDateInAppTimezone, type SupportedModel } from "./constants";

/**
 * Generate array of dates between start and end (inclusive)
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function generateDateRange(
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate total cost for a date range and model
 *
 * Fetches token usage from Redis and applies pricing to calculate costs.
 *
 * @param modelName - AI model identifier (e.g., "gemini-2.5-flash")
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Cost breakdown with token usage and pricing
 */
export async function calculateCost(
  modelName: SupportedModel,
  startDate: string,
  endDate: string
): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  dailyAverage: {
    tokens: number;
    cost: number;
  };
}> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  // Build Redis keys for all dates
  const inputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_INPUT(modelName, date));
  const outputKeys = dates.map((date) =>
    KEY_PATTERNS.TOKEN_OUTPUT(modelName, date)
  );

  // Fetch all token counts in parallel
  const [inputCounts, outputCounts] = await Promise.all([
    redis.mget(...inputKeys),
    redis.mget(...outputKeys),
  ]);

  // Sum up totals (handle null values from Redis)
  const totalInputTokens = (inputCounts as Array<number | null>).reduce<number>(
    (sum, count) => sum + (typeof count === "number" ? count : 0),
    0
  );
  const totalOutputTokens = (outputCounts as Array<number | null>).reduce<number>(
    (sum, count) => sum + (typeof count === "number" ? count : 0),
    0
  );
  const totalTokens = totalInputTokens + totalOutputTokens;

  // Get pricing for model
  const pricing = MODEL_PRICING[modelName];

  // Calculate costs
  const inputCost = (totalInputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost =
    (totalOutputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCost = inputCost + outputCost;

  // Calculate daily averages
  const numDays = dates.length;
  const dailyAverage = {
    tokens: Math.round(totalTokens / numDays),
    cost: totalCost / numDays,
  };

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    inputCost,
    outputCost,
    totalCost,
    dailyAverage,
  };
}

/**
 * Project monthly cost based on recent usage
 *
 * Uses trailing 7-day average to estimate monthly cost.
 *
 * @param modelName - AI model identifier
 * @returns Projected monthly cost in dollars
 */
export async function projectMonthlyCost(
  modelName: SupportedModel
): Promise<number> {
  const endDate = getCurrentDateInAppTimezone();

  // Calculate date 7 days ago in PST
  const today = new Date(endDate + "T00:00:00");
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const { dailyAverage } = await calculateCost(modelName, startDate, endDate);

  // Project for 30-day month
  return dailyAverage.cost * 30;
}
