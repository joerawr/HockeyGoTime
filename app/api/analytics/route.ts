/**
 * Analytics API endpoint
 * Feature: 006-privacy-analytics-dashboard
 *
 * GET /api/analytics - Retrieve aggregate analytics for date range
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllMetrics } from "@/lib/analytics/queries";
import { DATE_FORMAT_REGEX, MAX_DATE_RANGE_DAYS } from "@/lib/analytics/constants";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

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

    // Fetch metrics
    const metrics = await getAllMetrics(startDate, endDate);

    // Build response
    const response = {
      period: {
        start: startDate,
        end: endDate,
      },
      granularity: "daily" as const,
      metrics: {
        conversations: metrics.conversations,
        tokens: {
          "gemini-3-flash-preview": metrics.tokens,
        },
        tools: metrics.tools,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("❌ Analytics API error:", error);

    // Check if it's a Redis connection error
    if (error instanceof Error && error.message.includes("Redis")) {
      return NextResponse.json(
        {
          error: "storage_unavailable",
          message: "Unable to retrieve metrics. Please try again later.",
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
