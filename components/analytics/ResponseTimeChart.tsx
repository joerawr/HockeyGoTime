"use client";

/**
 * Response Time Chart Component
 * Issue: #20 - API Response Time Metrics
 *
 * Line chart showing daily average response times
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ResponseTimeChartProps {
  data: Array<{
    date: string;
    average: number;
    min: number;
    max: number;
    count: number;
  }>;
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  // Format data for Recharts
  // IMPORTANT: Add T12:00:00 to prevent timezone shifting (midnight UTC → previous day in PST)
  const chartData = data
    .filter((item) => item.count > 0) // Only show days with data
    .map((item) => ({
      date: new Date(item.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      responseTime: Math.round(item.average),
      min: Math.round(item.min),
      max: Math.round(item.max),
    }));

  // Custom tooltip to show min/max
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-background border border-border rounded-md p-3 shadow-lg"
          style={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <p className="font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>
            {data.date}
          </p>
          <p className="text-sm" style={{ color: "hsl(var(--primary))" }}>
            Avg: {data.responseTime}ms
          </p>
          <p className="text-xs text-muted-foreground">
            Min: {data.min}ms • Max: {data.max}ms
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "Response Time (ms)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
