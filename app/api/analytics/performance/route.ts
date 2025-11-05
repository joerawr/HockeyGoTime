/**
 * Performance Analytics API endpoint
 * Issue: #20 - API Response Time Metrics
 *
 * GET /api/analytics/performance - Retrieve response time metrics for date range
 */

import { NextRequest, NextResponse } from "next/server";
import { getResponseTimes } from "@/lib/analytics/queries";
import { DATE_FORMAT_REGEX, MAX_DATE_RANGE_DAYS } from "@/lib/analytics/constants";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const endpoint = searchParams.get("endpoint") || "/api/hockey-chat";

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

    // Fetch response time metrics
    const responseTimes = await getResponseTimes(endpoint, startDate, endDate);

    // Calculate summary statistics
    const validDays = responseTimes.filter((day) => day.count > 0);
    const totalRequests = responseTimes.reduce((sum, day) => sum + day.count, 0);
    const averageResponseTime = validDays.length > 0
      ? validDays.reduce((sum, day) => sum + day.average, 0) / validDays.length
      : 0;
    const minResponseTime = validDays.length > 0
      ? Math.min(...validDays.map((day) => day.min))
      : 0;
    const maxResponseTime = validDays.length > 0
      ? Math.max(...validDays.map((day) => day.max))
      : 0;

    // Build response
    const response = {
      period: {
        start: startDate,
        end: endDate,
      },
      endpoint,
      summary: {
        total_requests: totalRequests,
        average_response_time_ms: Math.round(averageResponseTime),
        min_response_time_ms: Math.round(minResponseTime),
        max_response_time_ms: Math.round(maxResponseTime),
      },
      daily_metrics: responseTimes,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("❌ Performance API error:", error);

    // Check if it's a Redis connection error
    if (error instanceof Error && error.message.includes("Redis")) {
      return NextResponse.json(
        {
          error: "storage_unavailable",
          message: "Unable to retrieve performance metrics. Please try again later.",
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
