# Data Model: Privacy-Compliant Analytics

**Feature**: 006-privacy-analytics-dashboard
**Date**: 2025-10-15

## Overview

This data model defines the structure for storing and retrieving aggregate, privacy-compliant analytics metrics. All data is stored in Upstash Redis with no user identifiers. The model supports time-series aggregation at daily, weekly, and monthly granularities.

---

## Core Entities

### 1. MetricCounter

**Description**: Represents an aggregate count for a specific metric over a time period.

**Redis Key Format**: `analytics:<metric>:<granularity>:<date>`

**Examples**:
- `analytics:conversations:daily:2025-10-15` → `127` (127 conversations on Oct 15)
- `analytics:tools:get_schedule:daily:2025-10-15` → `89` (89 schedule queries on Oct 15)
- `analytics:tokens:gemini-2.5-flash:input:daily:2025-10-15` → `245000` (245K input tokens on Oct 15)

**Attributes**:
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| metric_key | string | Redis key identifying the metric | Pattern: `analytics:*`, max 200 chars |
| count | integer | Aggregate count value | >= 0, incremented atomically |
| granularity | enum | Time period (daily, weekly, monthly) | One of: daily, weekly, monthly |
| date | string | Date in ISO format (YYYY-MM-DD for daily) | Valid ISO date |
| ttl | integer | Seconds until auto-deletion | 90 days for daily, 365 days for weekly |

**Operations**:
- `increment(metric_key, amount=1)`: Atomically increment counter with TTL set on first write
- `get(metric_key)`: Retrieve current count
- `get_range(metric_prefix, start_date, end_date)`: Fetch multiple days at once

**TypeScript Interface**:
```typescript
export interface MetricCounter {
  metricKey: string;
  count: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string; // YYYY-MM-DD format
  ttl: number;  // Seconds remaining until deletion
}
```

**Privacy Compliance**:
- ✅ No user identifiers in keys or values
- ✅ Purely aggregate counts
- ✅ Automatic deletion via TTL (90-day retention)

---

### 2. TokenUsage

**Description**: Tracks LLM token consumption with input/output breakdown for cost calculations.

**Redis Key Format**:
- Input: `analytics:tokens:<model>:input:<granularity>:<date>`
- Output: `analytics:tokens:<model>:output:<granularity>:<date>`

**Examples**:
- `analytics:tokens:gemini-2.5-flash:input:daily:2025-10-15` → `245000` (245K input tokens)
- `analytics:tokens:gemini-2.5-flash:output:daily:2025-10-15` → `62000` (62K output tokens)

**Attributes**:
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| model_name | string | AI model identifier | e.g., "gemini-2.5-flash" |
| input_tokens | integer | Total input tokens consumed | >= 0 |
| output_tokens | integer | Total output tokens generated | >= 0 |
| granularity | enum | Time period | One of: daily, weekly, monthly |
| date | string | Date in ISO format | Valid ISO date |
| input_price_per_million | decimal | Input token pricing | $0.30 for Gemini 2.5 Flash |
| output_price_per_million | decimal | Output token pricing | $2.50 for Gemini 2.5 Flash |

**Derived Fields** (calculated, not stored):
- `total_tokens = input_tokens + output_tokens`
- `estimated_cost = (input_tokens / 1M × input_price) + (output_tokens / 1M × output_price)`

**Operations**:
- `track_tokens(model, input_count, output_count, date)`: Increment both input and output counters
- `get_cost_estimate(model, start_date, end_date)`: Calculate total cost for date range

**TypeScript Interface**:
```typescript
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
```

**Privacy Compliance**:
- ✅ Tokens aggregated per model, not per user
- ✅ No query content stored
- ✅ No correlation to individual conversations

---

### 3. ToolCallMetrics

**Description**: Tracks MCP tool invocation counts by tool name (feature adoption metrics).

**Redis Key Format**: `analytics:tools:<tool_name>:<granularity>:<date>`

**Examples**:
- `analytics:tools:get_schedule:daily:2025-10-15` → `89`
- `analytics:tools:calculate_travel_times:daily:2025-10-15` → `34`
- `analytics:tools:get_player_stats:daily:2025-10-15` → `12`

**Attributes**:
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| tool_name | string | MCP tool identifier | Must match actual tool names |
| call_count | integer | Number of times tool was invoked | >= 0 |
| granularity | enum | Time period | One of: daily, weekly, monthly |
| date | string | Date in ISO format | Valid ISO date |

**Operations**:
- `track_tool_call(tool_name, date)`: Increment tool call counter
- `get_tool_breakdown(start_date, end_date)`: Get feature usage percentages

**TypeScript Interface**:
```typescript
export interface ToolCallMetrics {
  toolName: string;
  callCount: number;
  granularity: "daily" | "weekly" | "monthly";
  date: string;
}

export interface FeatureBreakdown {
  toolName: string;
  totalCalls: number;
  percentage: number; // 0-100
}
```

**Privacy Compliance**:
- ✅ Tool names are public API (not sensitive)
- ✅ No parameters or user context stored
- ✅ Purely aggregate counts

---

### 4. PerformanceMetrics

**Description**: Tracks API response times, error rates, and uptime for service health monitoring.

**Redis Key Format**:
- Response time: `analytics:performance:response_time_p95:<endpoint>:daily:<date>`
- Error rate: `analytics:errors:<endpoint>:daily:<date>`
- Success rate: `analytics:success:<endpoint>:daily:<date>`

**Examples**:
- `analytics:performance:response_time_p95:/api/hockey-chat:daily:2025-10-15` → `1250` (1.25s)
- `analytics:errors:/api/hockey-chat:daily:2025-10-15` → `3`
- `analytics:success:/api/hockey-chat:daily:2025-10-15` → `127`

**Attributes**:
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| endpoint | string | API route path | e.g., "/api/hockey-chat" |
| response_time_p95 | integer | 95th percentile response time (ms) | >= 0 |
| error_count | integer | Number of failed requests | >= 0 |
| success_count | integer | Number of successful requests | >= 0 |
| granularity | enum | Time period | One of: daily, weekly, monthly |
| date | string | Date in ISO format | Valid ISO date |

**Derived Fields**:
- `error_rate = error_count / (error_count + success_count) × 100`
- `uptime_percentage = (success_count / total_requests) × 100`

**Operations**:
- `track_response_time(endpoint, duration_ms, date)`: Record response time
- `track_error(endpoint, error_type, date)`: Increment error counter
- `track_success(endpoint, date)`: Increment success counter
- `calculate_uptime(endpoint, start_date, end_date)`: Compute uptime percentage

**TypeScript Interface**:
```typescript
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
  avgResponseTime: number; // milliseconds
  errorRate: number; // percentage (0-100)
  period: { start: string; end: string };
}
```

**Privacy Compliance**:
- ✅ No request details or user context stored
- ✅ Only aggregate counts and timing stats
- ✅ Error types are system-level, not user-specific

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│ MetricCounter   │─────┐
│ (base entity)   │     │
└─────────────────┘     │
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│ TokenUsage      │           │ ToolCallMetrics │
│ (specialization)│           │ (specialization)│
└─────────────────┘           └─────────────────┘
        │
        ▼
┌─────────────────┐
│ TokenCostEstimate│
│ (derived view)   │
└─────────────────┘

┌─────────────────┐
│ PerformanceMetrics│
│ (separate tree)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ ServiceHealth   │
│ (derived view)   │
└─────────────────┘
```

**Notes**:
- All entities are independent (no foreign keys, Redis is a key-value store)
- "Relationships" are logical groupings, not enforced constraints
- Dashboard queries fetch multiple entities and compute relationships client-side

---

## Data Aggregation Patterns

### Pattern 1: Daily → Weekly → Monthly Rollup

**Daily keys** (most granular):
```
analytics:conversations:daily:2025-10-15
analytics:conversations:daily:2025-10-16
analytics:conversations:daily:2025-10-17
...
```

**Weekly aggregation** (computed on-demand):
```typescript
// Dashboard computes weekly totals from daily keys
const weekStart = "2025-10-14"; // Monday
const weekEnd = "2025-10-20";   // Sunday
const dailyKeys = generateDateRange(weekStart, weekEnd).map(
  date => `analytics:conversations:daily:${date}`
);
const weeklyTotal = await redis.mget(...dailyKeys).then(
  counts => counts.reduce((sum, count) => sum + (count || 0), 0)
);
```

**Monthly aggregation** (same pattern):
```typescript
const monthStart = "2025-10-01";
const monthEnd = "2025-10-31";
const dailyKeys = generateDateRange(monthStart, monthEnd).map(
  date => `analytics:conversations:daily:${date}`
);
const monthlyTotal = await redis.mget(...dailyKeys).then(
  counts => counts.reduce((sum, count) => sum + (count || 0), 0)
);
```

**Rationale**: Store only daily granularity, compute aggregates on-demand. Redis MGET is fast enough for 90 days of data.

### Pattern 2: Multi-Metric Queries

**Fetch all tool calls for a date range**:
```typescript
const tools = ["get_schedule", "calculate_travel_times", "get_player_stats"];
const date = "2025-10-15";
const keys = tools.map(tool => `analytics:tools:${tool}:daily:${date}`);
const counts = await redis.mget(...keys);

const breakdown = tools.map((tool, i) => ({
  toolName: tool,
  count: counts[i] || 0,
}));
```

### Pattern 3: Cost Calculation

**Compute total cost for date range**:
```typescript
async function calculateCost(model: string, startDate: string, endDate: string): Promise<number> {
  const dates = generateDateRange(startDate, endDate);

  const inputKeys = dates.map(date => `analytics:tokens:${model}:input:daily:${date}`);
  const outputKeys = dates.map(date => `analytics:tokens:${model}:output:daily:${date}`);

  const [inputCounts, outputCounts] = await Promise.all([
    redis.mget(...inputKeys),
    redis.mget(...outputKeys),
  ]);

  const totalInputTokens = inputCounts.reduce((sum, count) => sum + (count || 0), 0);
  const totalOutputTokens = outputCounts.reduce((sum, count) => sum + (count || 0), 0);

  const inputCost = (totalInputTokens / 1_000_000) * 0.30;  // Gemini 2.5 Flash pricing
  const outputCost = (totalOutputTokens / 1_000_000) * 2.50;

  return inputCost + outputCost;
}
```

---

## State Transitions

### Metric Counter Lifecycle

```
[New Metric Key]
      ↓
   INCR command (creates key with value=1)
      ↓
   EXPIRE set (TTL=90 days for daily metrics)
      ↓
   [Active Metric] (incremented as events occur)
      ↓
   [After 90 days]
      ↓
   [Auto-deleted by Redis TTL]
```

**State Validation Rules**:
- Counter values must be >= 0 (can't go negative)
- TTL must be set on first increment (Lua script ensures atomicity)
- Keys without TTL are flagged as errors (indicates broken atomicity)

---

## Validation Rules

### Metric Key Naming
- **Pattern**: Must match `analytics:<metric>:<granularity>:<date>`
- **No PII**: Keys must not contain user IDs, IPs, emails, session IDs
- **Length**: Max 200 characters (Redis key size limit)
- **Lowercase**: Consistent casing for all dynamic segments

### Date Formats
- **Daily**: YYYY-MM-DD (e.g., "2025-10-15")
- **Weekly**: YYYY-Www (e.g., "2025-W42" for week 42)
- **Monthly**: YYYY-MM (e.g., "2025-10")
- **Validation**: Must be valid ISO dates, no future dates

### Token Counts
- **Range**: 0 to 1,000,000,000 (1 billion tokens max per day)
- **Type**: Integer only (no decimals)
- **Validation**: input_tokens + output_tokens must equal total_tokens

### TTL Values
- **Daily metrics**: 7,776,000 seconds (90 days)
- **Weekly metrics**: 31,536,000 seconds (365 days)
- **Monthly metrics**: 63,072,000 seconds (730 days = 2 years)
- **Minimum**: 86,400 seconds (1 day)

---

## Indexes & Query Optimization

**Redis doesn't support secondary indexes**, so optimization relies on:

1. **Key Prefixing**: Use `analytics:*` prefix for easy cleanup and isolation
2. **MGET Batching**: Fetch multiple days at once (Redis supports 1000s of keys per MGET)
3. **Key Scanning**: Use `SCAN` with `MATCH analytics:*` for discovery (avoids blocking `KEYS`)
4. **Client-Side Caching**: Cache dashboard data for 30 seconds to reduce Redis reads

**Example Scan Pattern** (for debugging or admin tools):
```typescript
// Find all conversation metrics for October 2025
const pattern = "analytics:conversations:daily:2025-10-*";
const keys: string[] = [];

let cursor = 0;
do {
  const [nextCursor, matches] = await redis.scan(cursor, { match: pattern, count: 100 });
  keys.push(...matches);
  cursor = nextCursor;
} while (cursor !== 0);
```

---

## Storage Estimates

### Per-Metric Storage Size
- **Key**: ~60 bytes (e.g., "analytics:conversations:daily:2025-10-15")
- **Value**: ~8 bytes (64-bit integer)
- **Redis overhead**: ~20 bytes (pointer, encoding, TTL)
- **Total per metric**: ~88 bytes

### Capacity Calculation (90-day retention)
- **Metrics per day**: ~20 (conversations, tokens, 5-10 tool types, errors, etc.)
- **Daily storage**: 20 × 88 bytes = 1.76 KB/day
- **90-day storage**: 1.76 KB × 90 = **158.4 KB** (negligible)
- **Commands per day**: 20 increments × 1000 conversations = **20,000 commands/day**
- **Free tier limit**: 500,000 commands/month = **16,666 commands/day**
- **Margin**: 16,666 / 20,000 = **Still within free tier at 1,000 conversations/day**

---

## Privacy Compliance Summary

### GDPR/CCPA Compliance Checklist

✅ **No personal data collected**:
- No user IDs, email addresses, or names
- No IP addresses or geolocation data
- No device fingerprints or user agents
- No session IDs or tracking cookies

✅ **Data minimization**:
- Only aggregate counters stored
- No event-level granularity with timestamps
- No query content or user input

✅ **Automatic deletion**:
- 90-day TTL enforced via Redis expiration
- No manual cleanup required
- Cannot reconstruct individual behavior

✅ **Transparency**:
- Privacy policy discloses analytics collection
- Could make dashboard public to demonstrate compliance
- No hidden tracking mechanisms

### Compliance Status: **EXEMPT from GDPR consent requirements** (Article 4(1) - anonymous data not considered personal data)

---

## Next Steps

1. Implement Redis client wrapper with Lua scripts (`lib/analytics/metrics.ts`)
2. Add tracking calls to `/app/api/hockey-chat/route.ts` onFinish callback
3. Build dashboard API endpoint (`/app/api/analytics/route.ts`)
4. Create Recharts visualization components (`components/analytics/`)
5. Add TypeScript types to codebase (`lib/analytics/types.ts`)
