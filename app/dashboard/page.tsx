"use client";

/**
 * Analytics Dashboard Page
 * Feature: 006-privacy-analytics-dashboard
 *
 * Privacy-compliant usage analytics with Recharts visualizations
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversationsChart } from "@/components/analytics/ConversationsChart";
import { TokenUsageChart } from "@/components/analytics/TokenUsageChart";
import { CostProjection } from "@/components/analytics/CostProjection";
import { APP_TIMEZONE } from "@/lib/analytics/constants";

interface AnalyticsData {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    conversations: Array<{ date: string; count: number }>;
    tokens: {
      "gemini-2.5-flash": Array<{ date: string; input: number; output: number }>;
    };
    tools: Record<string, Array<{ date: string; count: number }>>;
  };
}

interface CostData {
  period: {
    start: string;
    end: string;
  };
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    maps_api_cost: number;
    total_cost: number;
  };
  maps_api: {
    total_calls: number;
    total_errors: number;
    success_rate: number;
    cost: number;
  };
  projected_monthly_cost: number;
  daily_average: {
    tokens: number;
    cost: number;
  };
}

export default function DashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range (last 7 days) in PST to match tracking
  const endDate = new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });

  // Calculate start date (6 days ago, for 7 days total including today)
  const endDateObj = new Date(endDate + "T00:00:00");
  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - 6);
  const startDate = startDateObj.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        // Fetch analytics and cost data in parallel
        const [analyticsRes, costRes] = await Promise.all([
          fetch(`/api/analytics?start_date=${startDate}&end_date=${endDate}`),
          fetch(`/api/analytics/cost?start_date=${startDate}&end_date=${endDate}`),
        ]);

        if (!analyticsRes.ok || !costRes.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const [analytics, cost] = await Promise.all([
          analyticsRes.json(),
          costRes.json(),
        ]);

        setAnalyticsData(analytics);
        setCostData(cost);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Make sure Upstash Redis is configured correctly in your .env.local file.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData || !costData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">No data available</div>
        </div>
      </div>
    );
  }

  const tokenData = analyticsData.metrics.tokens["gemini-2.5-flash"] || [];
  const totalConversations = analyticsData.metrics.conversations.reduce(
    (sum, day) => sum + day.count,
    0
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Privacy-compliant usage metrics • Last 7 days
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Conversations</CardDescription>
            <CardTitle className="text-3xl">{totalConversations}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens</CardDescription>
            <CardTitle className="text-3xl">
              {costData.token_usage.total_tokens.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Period Cost</CardDescription>
            <CardTitle className="text-3xl">
              ${costData.cost_breakdown.total_cost.toFixed(4)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Conversations</CardTitle>
            <CardDescription>
              Number of chat sessions per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversationsChart data={analyticsData.metrics.conversations} />
          </CardContent>
        </Card>

        {/* Cost Projection */}
        <CostProjection
          totalCost={costData.cost_breakdown.total_cost}
          projectedMonthlyCost={costData.projected_monthly_cost}
          dailyAverage={costData.daily_average.cost}
          inputTokens={costData.token_usage.input_tokens}
          outputTokens={costData.token_usage.output_tokens}
          mapsApiCost={costData.maps_api.cost}
          mapsApiCalls={costData.maps_api.total_calls}
        />
      </div>

      {/* Token Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage Trends</CardTitle>
          <CardDescription>
            Input and output token consumption over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenUsageChart data={tokenData} />
        </CardContent>
      </Card>

      {/* Tool Usage Breakdown */}
      {Object.keys(analyticsData.metrics.tools).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>
              Most popular MCP tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.metrics.tools)
                .map(([toolName, dailyCounts]) => ({
                  name: toolName,
                  total: dailyCounts.reduce((sum, day) => sum + day.count, 0),
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((tool) => (
                  <div key={tool.name} className="flex items-center justify-between">
                    <div className="text-sm font-medium">{tool.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {tool.total} calls
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>
          All metrics are aggregate-only. No user identifiers collected. Data
          auto-deletes after 90 days.
        </p>
        <p className="mt-1">
          Dashboard auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
