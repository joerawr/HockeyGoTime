/**
 * Cost Analytics API endpoint
 * Feature: 006-privacy-analytics-dashboard
 *
 * GET /api/analytics/cost - Calculate estimated API costs for date range
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateCost } from "@/lib/analytics/cost";
import { getExternalApiCosts } from "@/lib/analytics/queries";
import {
  DATE_FORMAT_REGEX,
  MAX_DATE_RANGE_DAYS,
  MODEL_PRICING,
  type SupportedModel,
} from "@/lib/analytics/constants";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const model = (searchParams.get("model") || "gemini-3-flash") as SupportedModel;

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: "missing_parameters",
          message: "Both start_date and end_date are required",
          details: { start_date: startDate, end_date: endDate },
        },
        { status: 400 }
      );
    }

    // Validate date format
    if (!DATE_FORMAT_REGEX.test(startDate) || !DATE_FORMAT_REGEX.test(endDate)) {
      return NextResponse.json(
        {
          error: "invalid_date_format",
          message: "Dates must be in YYYY-MM-DD format",
          details: { start_date: startDate, end_date: endDate },
        },
        { status: 400 }
      );
    }

    // Validate model
    if (!MODEL_PRICING[model]) {
      return NextResponse.json(
        {
          error: "invalid_model",
          message: `Model '${model}' not found in analytics data`,
          details: {
            available_models: Object.keys(MODEL_PRICING),
          },
        },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        {
          error: "invalid_date_range",
          message: "start_date must be before or equal to end_date",
          details: { start_date: startDate, end_date: endDate },
        },
        { status: 400 }
      );
    }

    // Validate date range size
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      return NextResponse.json(
        {
          error: "date_range_too_large",
          message: `Date range must not exceed ${MAX_DATE_RANGE_DAYS} days`,
          details: { requested_days: daysDiff, max_days: MAX_DATE_RANGE_DAYS },
        },
        { status: 400 }
      );
    }

    // Calculate LLM and Maps API costs in parallel
    const [costData, mapsApiData] = await Promise.all([
      calculateCost(model, startDate, endDate),
      getExternalApiCosts("google-routes", startDate, endDate),
    ]);

    const pricing = MODEL_PRICING[model];

    // Build response
    const response = {
      period: {
        start: startDate,
        end: endDate,
      },
      model,
      token_usage: {
        input_tokens: costData.totalInputTokens,
        output_tokens: costData.totalOutputTokens,
        total_tokens: costData.totalTokens,
      },
      pricing: {
        input_price_per_million: pricing.inputPricePerMillion,
        output_price_per_million: pricing.outputPricePerMillion,
      },
      cost_breakdown: {
        input_cost: costData.inputCost,
        output_cost: costData.outputCost,
        maps_api_cost: mapsApiData.totalCost,
        total_cost: costData.totalCost + mapsApiData.totalCost,
      },
      maps_api: {
        total_calls: mapsApiData.totalCalls,
        total_errors: mapsApiData.totalErrors,
        success_rate: mapsApiData.successRate,
        cost: mapsApiData.totalCost,
      },
      projected_monthly_cost: (costData.dailyAverage.cost + mapsApiData.dailyAverage) * 30,
      daily_average: {
        tokens: costData.dailyAverage.tokens,
        cost: costData.dailyAverage.cost + mapsApiData.dailyAverage,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("❌ Cost analytics API error:", error);

    // Check if it's a Redis connection error
    if (error instanceof Error && error.message.includes("Redis")) {
      return NextResponse.json(
        {
          error: "storage_unavailable",
          message: "Unable to retrieve cost data. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "internal_error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
