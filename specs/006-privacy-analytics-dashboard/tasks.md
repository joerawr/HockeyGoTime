# Implementation Tasks: Privacy-Compliant Usage Analytics

**Feature**: 006-privacy-analytics-dashboard
**Branch**: `006-privacy-analytics-dashboard`
**Date**: 2025-10-15
**Total Tasks**: 29

## Task Organization

Tasks are organized by user story to enable independent implementation and testing. Each user story is a complete, deployable increment.

**Priority Structure**:
- **Phase 1**: Setup (foundational infrastructure)
- **Phase 2**: User Story 2 (P1) - Track Token Usage (enables cost tracking)
- **Phase 3**: User Story 3 (P1) - Track Feature Usage (enables feature analytics)
- **Phase 4**: User Story 1 (P1) - Admin Dashboard (displays tracked metrics)
- **Phase 5**: User Story 4 (P2) - Performance Metrics (advanced monitoring)
- **Phase 6**: User Story 5 (P2) - Trends & Projections (advanced analytics)
- **Phase 7**: Polish & Documentation

---

## Phase 1: Setup & Foundational Infrastructure

**Goal**: Establish core analytics library, Redis client, and TypeScript types that all user stories depend on.

**Checkpoint**: Redis client functional, type definitions complete, TypeScript compilation passes.

### T001 - Install Dependencies [Setup]
**File**: `package.json`
**Description**: Install Upstash Redis client and Recharts visualization library.
```bash
pnpm add @upstash/redis recharts
```
**Acceptance**: Dependencies appear in package.json and pnpm-lock.yaml

---

### T002 - Create Upstash Redis Account [Setup]
**External**: Upstash Console
**Description**:
1. Create free account at https://console.upstash.com
2. Create new Redis database (select nearest region)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Acceptance**: Credentials available for next task

---

### T003 - Configure Environment Variables [Setup]
**File**: `.env.local` and `.env.local.template`
**Description**: Add Upstash Redis credentials to environment configuration.

`.env.local`:
```bash
# Upstash Redis (Analytics)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

`.env.local.template` (add):
```bash
# Upstash Redis Configuration (required for analytics system)
UPSTASH_REDIS_REST_URL=https://your-project.upstash.io
UPSTASH_REDIS_REST_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Acceptance**: Environment variables load correctly, template documents required variables

---

### T004 - Create TypeScript Types [Setup]
**File**: `lib/analytics/types.ts`
**Description**: Define TypeScript interfaces for all analytics entities.

```typescript
// lib/analytics/types.ts
export interface MetricCounter {
  metricKey: string;
  count: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
  ttl: number;  // Seconds remaining
}

export interface TokenUsage {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export interface TokenCostEstimate {
  modelName: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  period: { start: string; end: string };
}

export interface ToolCallMetrics {
  toolName: string;
  callCount: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string;
}

export interface PerformanceMetrics {
  endpoint: string;
  responseTimeP95: number; // milliseconds
  errorCount: number;
  successCount: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string;
}

export interface ServiceHealth {
  endpoint: string;
  uptime: number; // percentage (0-100)
  avgResponseTime: number;
  errorRate: number;
  period: { start: string; end: string };
}

export interface DailyMetrics {
  date: string;
  conversations: number;
  inputTokens: number;
  outputTokens: number;
}
```

**Acceptance**: TypeScript compilation passes (`pnpm tsc --noEmit`)

---

### T005 - Create Redis Client Singleton [Setup]
**File**: `lib/analytics/client.ts`
**Description**: Initialize Upstash Redis client with error handling and singleton pattern.

```typescript
// lib/analytics/client.ts
import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

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
  }

  return redisClient;
}
```

**Acceptance**: Client initializes without error, throws clear error if env vars missing

---

### T006 - Define Redis Key Constants [Setup]
**File**: `lib/analytics/constants.ts`
**Description**: Define TTL values and key naming patterns.

```typescript
// lib/analytics/constants.ts
export const RETENTION_DAYS = 90;
export const TTL_SECONDS = RETENTION_DAYS * 24 * 60 * 60; // 7,776,000 seconds

export const KEY_PATTERNS = {
  CONVERSATION: (date: string) => `analytics:conversations:daily:${date}`,
  TOKEN_INPUT: (model: string, date: string) =>
    `analytics:tokens:${model}:input:daily:${date}`,
  TOKEN_OUTPUT: (model: string, date: string) =>
    `analytics:tokens:${model}:output:daily:${date}`,
  TOOL_CALL: (toolName: string, date: string) =>
    `analytics:tools:${toolName}:daily:${date}`,
  PERFORMANCE_P95: (endpoint: string, date: string) =>
    `analytics:performance:response_time_p95:${endpoint}:daily:${date}`,
  ERROR: (endpoint: string, date: string) =>
    `analytics:errors:${endpoint}:daily:${date}`,
  SUCCESS: (endpoint: string, date: string) =>
    `analytics:success:${endpoint}:daily:${date}`,
};
```

**Acceptance**: Constants export correctly, key patterns generate valid Redis keys

---

## Phase 2: User Story 2 (P1) - Track LLM Token Usage and Cost

**Story Goal**: Track all Gemini 2.5 Flash token usage in `/api/hockey-chat` endpoint with cost calculations.

**Independent Test**: Make AI chat requests, verify Redis token counters increment with correct values.

**Priority**: P1 (Critical for cost tracking before public launch)

---

### T007 - Implement Token Tracking Function [US2]
**File**: `lib/analytics/metrics.ts`
**Description**: Create core tracking function for LLM token usage with atomic Redis operations.

```typescript
// lib/analytics/metrics.ts
import { getRedisClient } from "./client";
import { TTL_SECONDS, KEY_PATTERNS } from "./constants";

// Lua script for atomic INCRBY with conditional EXPIRE
const INCRBY_WITH_EXPIRE = `
local count = redis.call("INCRBY", KEYS[1], ARGV[1])
if redis.call("TTL", KEYS[1]) < 0 then
    redis.call("EXPIRE", KEYS[1], ARGV[2])
end
return count
`;

export async function trackTokens(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  date: string
): Promise<void> {
  const redis = getRedisClient();

  const inputKey = KEY_PATTERNS.TOKEN_INPUT(modelName, date);
  const outputKey = KEY_PATTERNS.TOKEN_OUTPUT(modelName, date);

  await Promise.all([
    redis.eval(INCRBY_WITH_EXPIRE, [inputKey], [inputTokens, TTL_SECONDS]),
    redis.eval(INCRBY_WITH_EXPIRE, [outputKey], [outputTokens, TTL_SECONDS]),
  ]);
}
```

**Acceptance**: Function compiles, Lua script syntax valid

---

### T008 - Integrate Token Tracking in Chat API [US2]
**File**: `app/api/hockey-chat/route.ts`
**Description**: Add token tracking to existing `onFinish` callback (non-blocking).

Add import:
```typescript
import { trackTokens } from "@/lib/analytics/metrics";
```

Update `onFinish` callback (around line 560):
```typescript
onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
  console.log(`📊 Stream finished:`);
  console.log(`   Text length: ${text?.length || 0}`);
  console.log(`   Tool calls: ${toolCalls?.length || 0}`);
  console.log(`   Tool results: ${toolResults?.length || 0}`);
  console.log(`   Steps: ${steps?.length || 0}`);

  // NEW: Track tokens asynchronously (don't await to avoid blocking)
  if (usage) {
    const { inputTokens, outputTokens } = usage;
    const today = new Date().toISOString().split('T')[0];

    trackTokens("gemini-2.5-flash", inputTokens, outputTokens, today)
      .catch((error) => console.error("❌ Token tracking failed:", error));

    // Calculate and log cost
    const cost = (inputTokens / 1_000_000) * 0.30 + (outputTokens / 1_000_000) * 2.50;
    console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);
  }

  // Existing MCP disconnect code...
  console.log(`🔌 Disconnecting ${selectedMcpLabel} MCP client...`);
  await activeMcpClient.disconnect();
},
```

**Acceptance**: Token tracking executes without blocking AI responses, errors logged but don't crash

---

### T009 - Implement Cost Calculation Utility [US2]
**File**: `lib/analytics/cost.ts`
**Description**: Create utility to calculate API costs from token usage.

```typescript
// lib/analytics/cost.ts
import { getRedisClient } from "./client";
import { KEY_PATTERNS } from "./constants";
import type { TokenCostEstimate } from "./types";

// Gemini 2.5 Flash pricing
const PRICING = {
  "gemini-2.5-flash": {
    inputPricePerMillion: 0.30,
    outputPricePerMillion: 2.50,
  },
};

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function calculateCost(
  model: string,
  startDate: string,
  endDate: string
): Promise<TokenCostEstimate> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  const inputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_INPUT(model, date));
  const outputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_OUTPUT(model, date));

  const [inputCounts, outputCounts] = await Promise.all([
    redis.mget<number[]>(...inputKeys),
    redis.mget<number[]>(...outputKeys),
  ]);

  const totalInputTokens = inputCounts.reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const totalOutputTokens = outputCounts.reduce(
    (sum, count) => sum + (count || 0),
    0
  );

  const pricing = PRICING[model as keyof typeof PRICING];
  const inputCost = (totalInputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (totalOutputTokens / 1_000_000) * pricing.outputPricePerMillion;

  return {
    modelName: model,
    totalInputTokens,
    totalOutputTokens,
    estimatedCost: inputCost + outputCost,
    period: { start: startDate, end: endDate },
  };
}
```

**Acceptance**: Cost calculation matches formula: `(input/1M × $0.30) + (output/1M × $2.50)`

---

### T010 - Test Token Tracking [US2]
**Manual Test**
**Description**: Verify token tracking works end-to-end.

Test Steps:
1. Start dev server: `pnpm dev`
2. Send chat request to http://localhost:3000
3. Check console logs for cost output
4. Open Upstash Console → Data Browser
5. Look for keys:
   - `analytics:tokens:gemini-2.5-flash:input:daily:2025-10-15`
   - `analytics:tokens:gemini-2.5-flash:output:daily:2025-10-15`
6. Verify values are integers > 0
7. Check TTL is set (~7,776,000 seconds = 90 days)

**Acceptance**: Token counters increment correctly, TTL enforced, no errors in console

---

**Checkpoint**: Token tracking complete. Deploy to development branch for early validation.

---

## Phase 3: User Story 3 (P1) - Track Feature Usage Patterns

**Story Goal**: Track MCP tool invocations to understand feature adoption.

**Independent Test**: Trigger each MCP tool, verify corresponding Redis counter increments.

**Priority**: P1 (Critical for roadmap prioritization)

---

### T011 - Implement Conversation Tracking Function [US3]
**File**: `lib/analytics/metrics.ts` (add to existing)
**Description**: Add function to track total conversations.

```typescript
// Add to lib/analytics/metrics.ts

// Lua script for atomic INCR with conditional EXPIRE
const INCR_WITH_EXPIRE = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

export async function trackConversation(date: string): Promise<void> {
  const redis = getRedisClient();
  const key = KEY_PATTERNS.CONVERSATION(date);
  await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
}
```

**Acceptance**: Function compiles without error

---

### T012 - Implement Tool Call Tracking Function [US3]
**File**: `lib/analytics/metrics.ts` (add to existing)
**Description**: Add function to track MCP tool invocations.

```typescript
// Add to lib/analytics/metrics.ts

export async function trackToolCall(toolName: string, date: string): Promise<void> {
  const redis = getRedisClient();
  const key = KEY_PATTERNS.TOOL_CALL(toolName, date);
  await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
}
```

**Acceptance**: Function compiles without error

---

### T013 - Integrate Feature Tracking in Chat API [US3]
**File**: `app/api/hockey-chat/route.ts`
**Description**: Add conversation and tool call tracking to `onFinish` callback.

Add import:
```typescript
import { trackConversation, trackToolCall, trackTokens } from "@/lib/analytics/metrics";
```

Update `onFinish` callback:
```typescript
onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
  // Existing logging...

  const today = new Date().toISOString().split('T')[0];

  // NEW: Track conversation
  trackConversation(today).catch((error) =>
    console.error("❌ Conversation tracking failed:", error)
  );

  // NEW: Track tool calls
  if (toolCalls && toolCalls.length > 0) {
    for (const call of toolCalls) {
      trackToolCall(call.toolName, today).catch((error) =>
        console.error(`❌ Tool tracking failed for ${call.toolName}:`, error)
      );
    }
  }

  // Existing token tracking...
  if (usage) {
    // ... (from T008)
  }

  // Existing MCP disconnect...
},
```

**Acceptance**: Conversation and tool tracking execute without blocking, errors logged

---

### T014 - Test Feature Tracking [US3]
**Manual Test**
**Description**: Verify feature tracking works for different query types.

Test Steps:
1. Ask schedule question: "When do we play next?"
2. Check Upstash Console for key: `analytics:tools:get_schedule:daily:2025-10-15`
3. Ask travel question: "What time should we leave?"
4. Check for key: `analytics:tools:calculate_travel_times:daily:2025-10-15`
5. Verify conversation counter incremented: `analytics:conversations:daily:2025-10-15`

**Acceptance**: All tool-specific counters increment correctly, conversation count matches

---

**Checkpoint**: Feature tracking complete. Both US2 and US3 now collecting data for dashboard.

---

## Phase 4: User Story 1 (P1) - Admin Views Usage Metrics Dashboard

**Story Goal**: Build admin dashboard at `/dashboard` displaying 7-day usage trends.

**Independent Test**: Seed Redis with mock data, verify dashboard renders correctly.

**Priority**: P1 (Provides visibility into tracked metrics from US2 and US3)

---

### T015 - Create Analytics Query Functions [US1]
**File**: `lib/analytics/queries.ts`
**Description**: Implement functions to fetch metrics from Redis for dashboard.

```typescript
// lib/analytics/queries.ts
import { getRedisClient } from "./client";
import { KEY_PATTERNS } from "./constants";
import type { DailyMetrics } from "./types";

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function getConversationMetrics(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; count: number }>> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);
  const keys = dates.map((date) => KEY_PATTERNS.CONVERSATION(date));

  const counts = await redis.mget<number[]>(...keys);

  return dates.map((date, i) => ({
    date,
    count: counts[i] || 0,
  }));
}

export async function getTokenMetrics(
  model: string,
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  const inputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_INPUT(model, date));
  const outputKeys = dates.map((date) => KEY_PATTERNS.TOKEN_OUTPUT(model, date));
  const conversationKeys = dates.map((date) => KEY_PATTERNS.CONVERSATION(date));

  const [inputCounts, outputCounts, conversations] = await Promise.all([
    redis.mget<number[]>(...inputKeys),
    redis.mget<number[]>(...outputKeys),
    redis.mget<number[]>(...conversationKeys),
  ]);

  return dates.map((date, i) => ({
    date,
    conversations: conversations[i] || 0,
    inputTokens: inputCounts[i] || 0,
    outputTokens: outputCounts[i] || 0,
  }));
}

export async function getToolBreakdown(
  startDate: string,
  endDate: string
): Promise<Array<{ toolName: string; count: number; percentage: number }>> {
  const redis = getRedisClient();
  const dates = generateDateRange(startDate, endDate);

  const tools = ["get_schedule", "calculate_travel_times", "get_player_stats", "get_team_stats"];
  const allKeys = tools.flatMap((tool) =>
    dates.map((date) => KEY_PATTERNS.TOOL_CALL(tool, date))
  );

  const counts = await redis.mget<number[]>(...allKeys);

  const toolTotals = tools.map((tool, toolIndex) => {
    const start = toolIndex * dates.length;
    const end = start + dates.length;
    const total = counts.slice(start, end).reduce((sum, count) => sum + (count || 0), 0);
    return { toolName: tool, count: total };
  });

  const grandTotal = toolTotals.reduce((sum, tool) => sum + tool.count, 0);

  return toolTotals
    .filter((tool) => tool.count > 0)
    .map((tool) => ({
      ...tool,
      percentage: grandTotal > 0 ? (tool.count / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
```

**Acceptance**: Query functions compile, return correct data structure

---

### T016 - Create Analytics API Endpoint [US1]
**File**: `app/api/analytics/route.ts`
**Description**: Build GET endpoint for dashboard data with error handling.

```typescript
// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConversationMetrics, getTokenMetrics, getToolBreakdown } from "@/lib/analytics/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "dates must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const [conversations, tokens, tools] = await Promise.all([
      getConversationMetrics(startDate, endDate),
      getTokenMetrics("gemini-2.5-flash", startDate, endDate),
      getToolBreakdown(startDate, endDate),
    ]);

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      metrics: {
        conversations,
        tokens,
        tools,
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Unable to fetch metrics" },
      { status: 500 }
    );
  }
}
```

**Acceptance**: API returns valid JSON, handles errors gracefully

---

### T017 - Create Conversations Chart Component [US1] [P]
**File**: `components/analytics/ConversationsChart.tsx`
**Description**: Build Recharts bar chart for daily conversations.

```typescript
// components/analytics/ConversationsChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ConversationsChartProps {
  data: Array<{ date: string; count: number }>;
}

export function ConversationsChart({ data }: ConversationsChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Daily Conversations</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Acceptance**: Component renders without error, displays data correctly

---

### T018 - Create Token Usage Chart Component [US1] [P]
**File**: `components/analytics/TokenUsageChart.tsx`
**Description**: Build Recharts line chart for token consumption trends.

```typescript
// components/analytics/TokenUsageChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TokenUsageChartProps {
  data: Array<{ date: string; inputTokens: number; outputTokens: number }>;
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Token Usage Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="inputTokens" stroke="#8b5cf6" name="Input Tokens" />
          <Line type="monotone" dataKey="outputTokens" stroke="#10b981" name="Output Tokens" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Acceptance**: Component renders without error, displays two lines correctly

---

### T019 - Create Tool Breakdown Chart Component [US1] [P]
**File**: `components/analytics/ToolBreakdownChart.tsx`
**Description**: Build simple table view for feature usage breakdown.

```typescript
// components/analytics/ToolBreakdownChart.tsx
"use client";

interface ToolBreakdownProps {
  data: Array<{ toolName: string; count: number; percentage: number }>;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_schedule: "Schedule Queries",
  calculate_travel_times: "Travel Times",
  get_player_stats: "Player Stats",
  get_team_stats: "Team Stats",
};

export function ToolBreakdownChart({ data }: ToolBreakdownProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Feature Usage Breakdown</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No tool usage data yet</p>
      ) : (
        <div className="space-y-3">
          {data.map((tool) => (
            <div key={tool.toolName} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">
                    {TOOL_DISPLAY_NAMES[tool.toolName] || tool.toolName}
                  </span>
                  <span className="text-gray-600">{tool.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${tool.percentage}%` }}
                  />
                </div>
              </div>
              <span className="ml-4 text-gray-500">{tool.count} calls</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance**: Component renders without error, displays percentages correctly

---

### T020 - Create Dashboard Page [US1]
**File**: `app/dashboard/page.tsx`
**Description**: Build main dashboard page that fetches and displays analytics.

```typescript
// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ConversationsChart } from "@/components/analytics/ConversationsChart";
import { TokenUsageChart } from "@/components/analytics/TokenUsageChart";
import { ToolBreakdownChart } from "@/components/analytics/ToolBreakdownChart";

interface AnalyticsData {
  period: { start: string; end: string };
  metrics: {
    conversations: Array<{ date: string; count: number }>;
    tokens: Array<{ date: string; conversations: number; inputTokens: number; outputTokens: number }>;
    tools: Array<{ toolName: string; count: number; percentage: number }>;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const response = await fetch(
          `/api/analytics?start_date=${startDate}&end_date=${endDate}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">HockeyGoTime Analytics</h1>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">HockeyGoTime Analytics</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading metrics: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">HockeyGoTime Analytics</h1>
        <p className="text-gray-600 mb-8">
          Last 7 days ({data.period.start} to {data.period.end})
        </p>

        <div className="space-y-6">
          <ConversationsChart data={data.metrics.conversations} />
          <TokenUsageChart data={data.metrics.tokens} />
          <ToolBreakdownChart data={data.metrics.tools} />
        </div>
      </div>
    </div>
  );
}
```

**Acceptance**: Dashboard loads, displays all charts, handles loading and error states

---

### T021 - Test Dashboard End-to-End [US1]
**Manual Test**
**Description**: Verify dashboard displays tracked metrics correctly.

Test Steps:
1. Ensure some conversations have been tracked (run T010 and T014 first)
2. Navigate to http://localhost:3000/dashboard
3. Verify page loads without errors
4. Check conversations bar chart displays
5. Check token usage line chart displays
6. Check tool breakdown displays
7. Verify all data matches Redis values

**Acceptance**: Dashboard renders all charts with accurate data from Redis

---

**Checkpoint**: MVP Complete! All P1 stories (US1, US2, US3) implemented and tested. Dashboard displays token usage and feature adoption metrics.

---

## Phase 5: User Story 4 (P2) - Track Performance and Reliability Metrics

**Story Goal**: Track API response times, error rates, and uptime.

**Independent Test**: Simulate slow responses and errors, verify metrics recorded.

**Priority**: P2 (Advanced monitoring, not blocking public launch)

---

### T022 - Implement Performance Tracking Functions [US4]
**File**: `lib/analytics/metrics.ts` (add to existing)
**Description**: Add functions to track response times and errors.

```typescript
// Add to lib/analytics/metrics.ts

export async function trackResponseTime(
  endpoint: string,
  durationMs: number,
  date: string
): Promise<void> {
  const redis = getRedisClient();
  const key = KEY_PATTERNS.PERFORMANCE_P95(endpoint, date);

  // Simplified: store as running average (full P95 calculation would need histogram)
  await redis.eval(INCRBY_WITH_EXPIRE, [key], [durationMs, TTL_SECONDS]);
}

export async function trackSuccess(endpoint: string, date: string): Promise<void> {
  const redis = getRedisClient();
  const key = KEY_PATTERNS.SUCCESS(endpoint, date);
  await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
}

export async function trackError(endpoint: string, date: string): Promise<void> {
  const redis = getRedisClient();
  const key = KEY_PATTERNS.ERROR(endpoint, date);
  await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
}
```

**Acceptance**: Functions compile without error

---

### T023 - Integrate Performance Tracking in Chat API [US4]
**File**: `app/api/hockey-chat/route.ts`
**Description**: Add performance tracking to chat endpoint.

Add imports:
```typescript
import { trackSuccess, trackError, trackResponseTime } from "@/lib/analytics/metrics";
```

Add at start of POST handler:
```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];

  try {
    // ... existing code ...

    // At end of successful request (before return):
    const duration = Date.now() - startTime;
    trackSuccess("/api/hockey-chat", today).catch(console.error);
    trackResponseTime("/api/hockey-chat", duration, today).catch(console.error);

    return result.toDataStreamResponse();
  } catch (error) {
    const duration = Date.now() - startTime;
    trackError("/api/hockey-chat", today).catch(console.error);
    trackResponseTime("/api/hockey-chat", duration, today).catch(console.error);
    throw error;
  }
}
```

**Acceptance**: Performance tracking executes without blocking, errors logged

---

### T024 - Create Performance Metrics Component [US4]
**File**: `components/analytics/PerformanceMetrics.tsx`
**Description**: Build stats cards for performance metrics.

```typescript
// components/analytics/PerformanceMetrics.tsx
"use client";

interface PerformanceMetricsProps {
  avgResponseTime: number; // milliseconds
  errorRate: number; // percentage
  uptime: number; // percentage
}

export function PerformanceMetrics({ avgResponseTime, errorRate, uptime }: PerformanceMetricsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Performance & Reliability</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{avgResponseTime.toFixed(0)}ms</p>
          <p className="text-gray-600 mt-1">Avg Response Time</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-600">{errorRate.toFixed(1)}%</p>
          <p className="text-gray-600 mt-1">Error Rate</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{uptime.toFixed(1)}%</p>
          <p className="text-gray-600 mt-1">Uptime</p>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance**: Component renders correctly with metrics

---

### T025 - Integrate Performance Metrics into Dashboard [US4]
**File**: `app/dashboard/page.tsx`
**Description**: Add performance metrics to dashboard (requires API update).

Update API endpoint to include performance data, then add to dashboard:
```typescript
import { PerformanceMetrics } from "@/components/analytics/PerformanceMetrics";

// In dashboard render:
<PerformanceMetrics
  avgResponseTime={1250}
  errorRate={0.5}
  uptime={99.5}
/>
```

**Acceptance**: Performance metrics display on dashboard

---

**Checkpoint**: Performance tracking complete (US4). Dashboard now shows reliability metrics.

---

## Phase 6: User Story 5 (P2) - View Historical Trends and Cost Projections

**Story Goal**: Display cost projections and trend analysis.

**Independent Test**: Seed multi-week data, verify projections calculate correctly.

**Priority**: P2 (Advanced analytics for financial planning)

---

### T026 - Create Cost Projection Component [US5]
**File**: `components/analytics/CostProjection.tsx`
**Description**: Build component to display monthly cost estimates.

```typescript
// components/analytics/CostProjection.tsx
"use client";

interface CostProjectionProps {
  dailyAvgCost: number;
  projectedMonthlyCost: number;
  budgetThreshold?: number;
}

export function CostProjection({ dailyAvgCost, projectedMonthlyCost, budgetThreshold = 50 }: CostProjectionProps) {
  const isOverBudget = projectedMonthlyCost > budgetThreshold;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Cost Projection</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Daily Average</p>
          <p className="text-2xl font-bold">${dailyAvgCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Projected Monthly Cost</p>
          <p className={`text-3xl font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
            ${projectedMonthlyCost.toFixed(2)}
          </p>
          {isOverBudget && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Approaching budget threshold (${budgetThreshold}/month)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance**: Component displays cost projection with budget alerts

---

### T027 - Create Cost API Endpoint [US5]
**File**: `app/api/analytics/cost/route.ts`
**Description**: Build GET endpoint for cost calculations.

```typescript
// app/api/analytics/cost/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculateCost } from "@/lib/analytics/cost";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const model = searchParams.get("model") || "gemini-2.5-flash";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date required" },
        { status: 400 }
      );
    }

    const costEstimate = await calculateCost(model, startDate, endDate);

    const daysDiff = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyAvg = costEstimate.estimatedCost / (daysDiff + 1);
    const projectedMonthly = dailyAvg * 30;

    return NextResponse.json({
      ...costEstimate,
      dailyAverage: dailyAvg,
      projectedMonthlyCost: projectedMonthly,
    });
  } catch (error) {
    console.error("Cost API error:", error);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
```

**Acceptance**: API returns cost projection with daily average

---

### T028 - Integrate Cost Projection into Dashboard [US5]
**File**: `app/dashboard/page.tsx`
**Description**: Add cost projection to dashboard.

Update dashboard to fetch cost data and display projection component.

**Acceptance**: Cost projection displays on dashboard with accurate calculations

---

**Checkpoint**: All user stories complete (US1-US5). Full analytics dashboard functional.

---

## Phase 7: Polish & Documentation

**Goal**: Finalize TypeScript checks, update privacy policy, verify Vercel deployment.

---

### T029 - Run TypeScript Compilation Check [Polish]
**Command**: `pnpm tsc --noEmit`
**Description**: Verify all TypeScript code compiles without errors.

**Acceptance**: Zero TypeScript errors, strict mode passes

---

### T030 - Update Privacy Policy [Documentation]
**File**: `app/privacy/page.tsx`
**Description**: Add analytics disclosure to privacy policy.

Add section:
```markdown
## Analytics

We collect anonymous, aggregate analytics to monitor service health:
- Daily conversation counts (no user identifiers)
- Tool usage statistics (no query content)
- Token consumption metrics (no individual tracking)

This data is automatically deleted after 90 days and contains no personally identifiable information.
```

**Acceptance**: Privacy policy updated, reflects actual data collection

---

### T031 - Configure Vercel Environment Variables [Deployment]
**External**: Vercel Dashboard
**Description**: Add Upstash credentials to Vercel project settings.

Steps:
1. Open Vercel Dashboard → Project Settings → Environment Variables
2. Add `UPSTASH_REDIS_REST_URL` for all environments (Production, Preview, Development)
3. Add `UPSTASH_REDIS_REST_TOKEN` for all environments
4. Redeploy if needed

**Acceptance**: Environment variables set in Vercel, deployments succeed

---

### T032 - Deploy to Development Branch [Deployment]
**Git Operations**
**Description**: Commit all changes and push to development branch for testing.

```bash
git add .
git commit -m "feat: implement privacy-compliant analytics dashboard

- Add Upstash Redis integration for metrics storage
- Implement token usage tracking with cost calculations
- Add feature usage tracking (MCP tool invocations)
- Build admin dashboard with Recharts visualizations
- Add performance monitoring (response times, errors, uptime)
- Implement cost projections and trend analysis

Fixes #10"

git push origin 006-privacy-analytics-dashboard
```

**Acceptance**: Code pushed, Vercel preview deployment triggered

---

### T033 - Test on Vercel Preview [Testing]
**Manual Test**
**Description**: Verify analytics works in Vercel serverless environment.

Test Steps:
1. Open Vercel preview URL
2. Generate some conversations
3. Navigate to `/dashboard`
4. Verify metrics display correctly
5. Check Vercel function logs for errors
6. Verify Redis commands within free tier limits

**Acceptance**: Analytics fully functional on Vercel, no errors

---

**Final Checkpoint**: Feature complete and tested. Ready for production deployment.

---

## Dependencies & Parallel Execution

### Dependency Graph

```
Phase 1 (Setup)
  ↓
Phase 2 (US2: Token Tracking) ────┐
  ↓                                │
Phase 3 (US3: Feature Tracking) ──┼→ Phase 4 (US1: Dashboard)
  ↓                                │     ↓
Phase 5 (US4: Performance) ────────┘     │
  ↓                                      │
Phase 6 (US5: Trends) ─────────────────→│
  ↓
Phase 7 (Polish)
```

### Parallel Opportunities

**Within Phase 4 (US1)**:
- T017, T018, T019 can be implemented in parallel (different files, independent React components)

**Within Phase 2-3**:
- T011 and T012 can be implemented in parallel (same file, but independent functions)

**Within Phase 7**:
- T030 and T031 can be done in parallel (different systems)

### MVP Scope

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 + Phase 4
- **11 tasks** (T001-T021 excluding tests)
- **Estimated time**: 6-8 hours
- **Deliverable**: Working dashboard with token and feature tracking

**Full Feature** = All 33 tasks
- **Estimated time**: 10-14 hours
- **Deliverable**: Complete analytics system with performance monitoring and cost projections

---

## Implementation Strategy

### Recommended Approach

1. **Complete Phase 1** (foundational setup) - **DO NOT SKIP**
2. **Implement US2 (Token Tracking)** - Generates immediate cost visibility
3. **Implement US3 (Feature Tracking)** - Adds feature adoption insights
4. **Build US1 (Dashboard)** - Makes metrics visible and actionable
5. **Optional**: Add US4 and US5 for advanced monitoring

### Testing Strategy

- **Manual integration testing** after each user story phase
- **TypeScript compilation** after every file change (`pnpm tsc --noEmit`)
- **Privacy audit** before production (verify no PII in Redis keys)
- **Vercel preview testing** before merging to main

### Deployment Strategy

1. Complete MVP (Phases 1-4)
2. Deploy to development branch
3. Test on Vercel preview
4. Merge to main for production
5. Monitor Redis usage in Upstash Console
6. Add P2 stories (US4, US5) incrementally

---

## Success Criteria

### Technical Success
- [ ] TypeScript compilation passes with zero errors
- [ ] Dashboard loads in <2 seconds (P95)
- [ ] Metrics tracking adds <10ms overhead (P95)
- [ ] Redis commands stay within free tier (500K/month)

### Business Success
- [ ] Admin can answer: "How many conversations/day?"
- [ ] Admin can answer: "Which features are most popular?"
- [ ] Admin can answer: "What are monthly API costs?"
- [ ] Cost projections enable informed scaling decisions

### Privacy Compliance
- [ ] No PII in Redis keys or values (verified)
- [ ] Privacy policy updated with analytics disclosure
- [ ] 90-day TTL enforced on all metrics keys
- [ ] GDPR compliance verified (anonymous data exemption)

---

## Quick Reference

**Key Files**:
- `lib/analytics/metrics.ts` - Core tracking functions
- `lib/analytics/queries.ts` - Data fetching for dashboard
- `app/api/hockey-chat/route.ts` - Integration point for tracking
- `app/dashboard/page.tsx` - Admin dashboard UI
- `app/api/analytics/route.ts` - Dashboard data API

**Redis Key Patterns**:
- `analytics:conversations:daily:YYYY-MM-DD`
- `analytics:tokens:gemini-2.5-flash:input:daily:YYYY-MM-DD`
- `analytics:tokens:gemini-2.5-flash:output:daily:YYYY-MM-DD`
- `analytics:tools:{toolName}:daily:YYYY-MM-DD`

**Important Commands**:
- `pnpm tsc --noEmit` - Verify TypeScript compilation
- `pnpm dev` - Start development server
- Check Upstash Console → Data Browser for Redis keys
- Check Vercel Dashboard → Environment Variables for config

---

**End of Tasks Document**
