# Quickstart: Privacy-Compliant Analytics Integration

**Feature**: 006-privacy-analytics-dashboard
**Date**: 2025-10-15

## Overview

This quickstart guide demonstrates how to integrate privacy-compliant analytics tracking into HockeyGoTime. Follow these scenarios to understand the implementation patterns and verify the system works correctly.

---

## Prerequisites

1. **Upstash Redis Account**:
   - Create free account at [https://console.upstash.com](https://console.upstash.com)
   - Create new Redis database (select nearest region)
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

2. **Environment Variables**:
   ```bash
   # Add to .env.local
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

3. **Install Dependencies**:
   ```bash
   pnpm add @upstash/redis recharts
   ```

4. **Verify TypeScript Compilation**:
   ```bash
   pnpm tsc --noEmit
   ```

---

## Scenario 1: Track a Conversation

**Goal**: Increment the daily conversation counter when a user completes a chat.

**Implementation**:

1. Create analytics library (`lib/analytics/metrics.ts`):
   ```typescript
   import { Redis } from "@upstash/redis";

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL!,
     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
   });

   const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

   // Lua script for atomic increment with TTL
   const INCR_WITH_EXPIRE = `
   local count = redis.call("INCR", KEYS[1])
   if count == 1 then
       redis.call("EXPIRE", KEYS[1], ARGV[1])
   end
   return count
   `;

   export async function trackConversation(date: string): Promise<void> {
     const key = `analytics:conversations:daily:${date}`;
     await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
   }
   ```

2. Update `/app/api/hockey-chat/route.ts` onFinish callback:
   ```typescript
   import { trackConversation } from "@/lib/analytics/metrics";

   // Inside streamText onFinish callback (around line 560):
   onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
     // Existing logging...

     // NEW: Track conversation (non-blocking)
     const today = new Date().toISOString().split('T')[0];
     trackConversation(today).catch(console.error);

     // Existing MCP disconnect...
   },
   ```

**Test**:
```bash
# Start dev server
pnpm dev

# Send chat request to http://localhost:3000

# Check Upstash Console (Data Browser)
# Look for key: analytics:conversations:daily:2025-10-15
# Value should be: 1 (or incremented if multiple requests)
```

**Verification**:
- ✅ Redis key exists with pattern `analytics:conversations:daily:YYYY-MM-DD`
- ✅ Value is an integer >= 1
- ✅ TTL is set (check with `TTL` command in Upstash console)
- ✅ Chat response not delayed (tracking is async)

---

## Scenario 2: Track Token Usage and Cost

**Goal**: Record Gemini 2.5 Flash token consumption and calculate costs.

**Implementation**:

1. Add token tracking function (`lib/analytics/metrics.ts`):
   ```typescript
   export async function trackTokens(
     modelName: string,
     inputTokens: number,
     outputTokens: number,
     date: string
   ): Promise<void> {
     const inputKey = `analytics:tokens:${modelName}:input:daily:${date}`;
     const outputKey = `analytics:tokens:${modelName}:output:daily:${date}`;

     // Use INCRBY for token counts (not just +1)
     const INCRBY_WITH_EXPIRE = `
     local count = redis.call("INCRBY", KEYS[1], ARGV[1])
     if redis.call("TTL", KEYS[1]) < 0 then
         redis.call("EXPIRE", KEYS[1], ARGV[2])
     end
     return count
     `;

     await Promise.all([
       redis.eval(INCRBY_WITH_EXPIRE, [inputKey], [inputTokens, TTL_SECONDS]),
       redis.eval(INCRBY_WITH_EXPIRE, [outputKey], [outputTokens, TTL_SECONDS]),
     ]);
   }
   ```

2. Update onFinish callback to track tokens:
   ```typescript
   onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
     // Existing conversation tracking...

     // NEW: Track tokens and calculate cost
     if (usage) {
       const { inputTokens, outputTokens } = usage;
       const today = new Date().toISOString().split('T')[0];

       trackTokens("gemini-2.5-flash", inputTokens, outputTokens, today)
         .catch(console.error);

       // Calculate cost (Gemini 2.5 Flash pricing)
       const cost = (inputTokens / 1_000_000) * 0.30 + (outputTokens / 1_000_000) * 2.50;
       console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);
     }

     // Existing MCP disconnect...
   },
   ```

**Test**:
```bash
# Send chat request
# Check console logs for cost output

# Check Upstash Console for keys:
# analytics:tokens:gemini-2.5-flash:input:daily:2025-10-15 → 2450 (example)
# analytics:tokens:gemini-2.5-flash:output:daily:2025-10-15 → 620 (example)
```

**Verification**:
- ✅ Input and output token keys exist
- ✅ Values are reasonable (hundreds to thousands per conversation)
- ✅ Cost calculation matches: `(input/1M × $0.30) + (output/1M × $2.50)`
- ✅ Console logs show cost per request

---

## Scenario 3: Track MCP Tool Calls

**Goal**: Record which MCP tools are invoked (feature adoption metrics).

**Implementation**:

1. Add tool tracking function (`lib/analytics/metrics.ts`):
   ```typescript
   export async function trackToolCall(toolName: string, date: string): Promise<void> {
     const key = `analytics:tools:${toolName}:daily:${date}`;
     await redis.eval(INCR_WITH_EXPIRE, [key], [TTL_SECONDS]);
   }
   ```

2. Update onFinish callback to track tool calls:
   ```typescript
   onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
     // Existing tracking...

     // NEW: Track tool calls
     if (toolCalls && toolCalls.length > 0) {
       const today = new Date().toISOString().split('T')[0];
       for (const call of toolCalls) {
         trackToolCall(call.toolName, today).catch(console.error);
       }
     }

     // Existing MCP disconnect...
   },
   ```

**Test**:
```bash
# Send chat request: "When do we play next?"
# This should trigger get_schedule tool

# Check Upstash Console for key:
# analytics:tools:get_schedule:daily:2025-10-15 → 1

# Send another request: "What time should we leave?"
# This should trigger calculate_travel_times tool

# Check Upstash Console for key:
# analytics:tools:calculate_travel_times:daily:2025-10-15 → 1
```

**Verification**:
- ✅ Tool-specific keys exist for each invoked tool
- ✅ Tool names match actual tool names (get_schedule, calculate_travel_times, etc.)
- ✅ Counts increment correctly with multiple calls

---

## Scenario 4: Build Analytics Dashboard

**Goal**: Create a simple dashboard page to visualize metrics.

**Implementation**:

1. Create analytics API endpoint (`app/api/analytics/route.ts`):
   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { Redis } from "@upstash/redis";

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL!,
     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
   });

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

       // Generate date range
       const dates = generateDateRange(startDate, endDate);

       // Fetch conversation counts
       const conversationKeys = dates.map(
         (date) => `analytics:conversations:daily:${date}`
       );
       const conversationCounts = await redis.mget<number[]>(...conversationKeys);

       const conversations = dates.map((date, i) => ({
         date,
         count: conversationCounts[i] || 0,
       }));

       return NextResponse.json({
         period: { start: startDate, end: endDate },
         metrics: { conversations },
       });
     } catch (error) {
       console.error("Analytics API error:", error);
       return NextResponse.json(
         { error: "internal_error" },
         { status: 500 }
       );
     }
   }

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
   ```

2. Create dashboard page (`app/dashboard/page.tsx`):
   ```typescript
   "use client";

   import { useEffect, useState } from "react";
   import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

   interface MetricData {
     date: string;
     count: number;
   }

   export default function DashboardPage() {
     const [data, setData] = useState<MetricData[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       async function fetchMetrics() {
         const endDate = new Date().toISOString().split("T")[0];
         const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
           .toISOString()
           .split("T")[0];

         const response = await fetch(
           `/api/analytics?start_date=${startDate}&end_date=${endDate}`
         );
         const result = await response.json();

         setData(result.metrics.conversations);
         setLoading(false);
       }

       fetchMetrics();
     }, []);

     if (loading) return <div>Loading metrics...</div>;

     return (
       <div className="p-8">
         <h1 className="text-3xl font-bold mb-8">HockeyGoTime Analytics</h1>

         <div className="bg-white p-6 rounded-lg shadow">
           <h2 className="text-xl font-semibold mb-4">Daily Conversations (Last 7 Days)</h2>
           <ResponsiveContainer width="100%" height={400}>
             <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="date" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="count" fill="#8884d8" />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>
     );
   }
   ```

**Test**:
```bash
# Ensure you have some metrics data (run Scenario 1-3 first)

# Navigate to http://localhost:3000/dashboard

# Verify:
# - Bar chart displays with dates on X-axis
# - Bars show conversation counts
# - Chart is responsive (resize browser window)
```

**Verification**:
- ✅ Dashboard page loads without errors
- ✅ API endpoint returns valid JSON
- ✅ Chart displays correct data from Redis
- ✅ TypeScript compilation passes (`pnpm tsc --noEmit`)

---

## Scenario 5: Calculate Monthly Costs

**Goal**: Estimate monthly API costs based on token usage.

**Implementation**:

1. Create cost calculation utility (`lib/analytics/cost.ts`):
   ```typescript
   import { Redis } from "@upstash/redis";

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL!,
     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
   });

   export async function calculateCost(
     model: string,
     startDate: string,
     endDate: string
   ): Promise<number> {
     const dates = generateDateRange(startDate, endDate);

     const inputKeys = dates.map(
       (date) => `analytics:tokens:${model}:input:daily:${date}`
     );
     const outputKeys = dates.map(
       (date) => `analytics:tokens:${model}:output:daily:${date}`
     );

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

     // Gemini 2.5 Flash pricing
     const inputCost = (totalInputTokens / 1_000_000) * 0.30;
     const outputCost = (totalOutputTokens / 1_000_000) * 2.50;

     return inputCost + outputCost;
   }

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
   ```

2. Create cost API endpoint (`app/api/analytics/cost/route.ts`):
   ```typescript
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

       const totalCost = await calculateCost(model, startDate, endDate);

       return NextResponse.json({
         period: { start: startDate, end: endDate },
         model,
         total_cost: totalCost,
         formatted: `$${totalCost.toFixed(2)}`,
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

**Test**:
```bash
# Calculate cost for October 2025
curl "http://localhost:3000/api/analytics/cost?start_date=2025-10-01&end_date=2025-10-31&model=gemini-2.5-flash"

# Expected response:
# {
#   "period": { "start": "2025-10-01", "end": "2025-10-31" },
#   "model": "gemini-2.5-flash",
#   "total_cost": 7.42,
#   "formatted": "$7.42"
# }
```

**Verification**:
- ✅ API returns cost calculation
- ✅ Cost formula matches: `(inputTokens/1M × $0.30) + (outputTokens/1M × $2.50)`
- ✅ Monthly projection is reasonable based on actual usage

---

## Scenario 6: Privacy Compliance Verification

**Goal**: Verify no PII is collected or stored.

**Verification Steps**:

1. **Check Redis Keys**:
   ```bash
   # In Upstash Console (Data Browser), run:
   SCAN 0 MATCH analytics:* COUNT 100

   # Verify all keys follow pattern:
   # analytics:<metric>:<granularity>:<date>
   ```

2. **Assert No User Identifiers**:
   ```bash
   # Search for potential PII patterns (should find nothing):
   # - No user IDs (UUIDs, sequential IDs)
   # - No session IDs
   # - No IP addresses
   # - No email addresses
   ```

3. **Check TTL**:
   ```bash
   # In Upstash Console, run:
   TTL analytics:conversations:daily:2025-10-15

   # Should return positive number (seconds until expiration)
   # Approximately: 7,776,000 (90 days)
   ```

4. **Code Review Checklist**:
   - ✅ No user IDs in Redis keys or values
   - ✅ No session tracking or correlation
   - ✅ No query content stored
   - ✅ All metrics are aggregate counters
   - ✅ TTL set on all keys (90-day retention)

**Privacy Policy Update**:

Add to `/app/privacy/page.tsx`:
```markdown
## Analytics

We collect anonymous, aggregate analytics to monitor service health:
- Daily conversation counts (no user identifiers)
- Tool usage statistics (no query content)
- Token consumption metrics (no individual tracking)

This data is automatically deleted after 90 days and contains no personally identifiable information.
```

---

## Troubleshooting

### Issue 1: Redis Connection Failed

**Error**: `ECONNREFUSED` or `Unauthorized`

**Solution**:
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set correctly
- Check Upstash Console for database status
- Test connection with curl:
  ```bash
  curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
       "$UPSTASH_REDIS_REST_URL/get/test"
  ```

### Issue 2: Metrics Not Incrementing

**Error**: Keys exist but values don't change

**Solution**:
- Check TTL hasn't expired (`TTL` command)
- Verify Lua script syntax (test in Upstash Console)
- Add logging to track when `trackConversation()` is called
- Confirm `onFinish` callback is executing (add console.log)

### Issue 3: TypeScript Errors

**Error**: `Property 'usage' does not exist on type 'FinishResult'`

**Solution**:
- Verify AI SDK version is 5.0+ (`pnpm list ai`)
- Update types: `pnpm add -D @types/node@latest`
- Run `pnpm tsc --noEmit` to see all errors

### Issue 4: Dashboard Not Loading

**Error**: `Module not found: Can't resolve 'recharts'`

**Solution**:
- Install Recharts: `pnpm add recharts`
- Verify `"use client"` directive at top of component
- Check Next.js build output for errors

---

## Next Steps

After completing these scenarios:

1. ✅ Run `/speckit.tasks` to generate implementation tasks
2. ✅ Implement tracking in production environment
3. ✅ Set up monitoring for Redis command usage
4. ✅ Add alerts for approaching free tier limits
5. ✅ Create advanced dashboard features (weekly trends, cost projections)

---

## Related Documentation

- **Spec**: `/specs/006-privacy-analytics-dashboard/spec.md`
- **Research**: `/specs/006-privacy-analytics-dashboard/research.md`
- **Data Model**: `/specs/006-privacy-analytics-dashboard/data-model.md`
- **API Contracts**: `/specs/006-privacy-analytics-dashboard/contracts/analytics-api.md`
