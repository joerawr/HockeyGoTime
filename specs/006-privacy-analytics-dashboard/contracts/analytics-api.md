# API Contract: Analytics Endpoints

**Feature**: 006-privacy-analytics-dashboard
**Date**: 2025-10-15
**Base URL**: `/api/analytics`

## Overview

This document specifies the HTTP API contract for retrieving aggregate analytics data. All endpoints return privacy-compliant metrics with no user identifiers.

---

## Endpoints

### 1. GET /api/analytics

**Description**: Retrieve aggregate analytics for a specified date range and metrics.

**Authentication**: None (MVP) or Environment variable check (future)

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| start_date | string | Yes | Start date (ISO format YYYY-MM-DD) | `2025-10-08` |
| end_date | string | Yes | End date (ISO format YYYY-MM-DD) | `2025-10-15` |
| metrics | string[] | No | Comma-separated metric types | `conversations,tokens,tools` |
| granularity | enum | No | Time aggregation level (default: daily) | `daily`, `weekly`, `monthly` |

**Request Example**:
```http
GET /api/analytics?start_date=2025-10-08&end_date=2025-10-15&metrics=conversations,tokens,tools&granularity=daily
```

**Success Response** (200 OK):
```json
{
  "period": {
    "start": "2025-10-08",
    "end": "2025-10-15"
  },
  "granularity": "daily",
  "metrics": {
    "conversations": [
      { "date": "2025-10-08", "count": 127 },
      { "date": "2025-10-09", "count": 142 },
      { "date": "2025-10-10", "count": 156 },
      { "date": "2025-10-11", "count": 134 },
      { "date": "2025-10-12", "count": 98 },
      { "date": "2025-10-13", "count": 112 },
      { "date": "2025-10-14", "count": 145 },
      { "date": "2025-10-15", "count": 163 }
    ],
    "tokens": {
      "gemini-2.5-flash": [
        { "date": "2025-10-08", "input": 245000, "output": 62000 },
        { "date": "2025-10-09", "input": 278000, "output": 71000 },
        { "date": "2025-10-10", "input": 302000, "output": 78000 },
        { "date": "2025-10-11", "input": 261000, "output": 67000 },
        { "date": "2025-10-12", "input": 189000, "output": 49000 },
        { "date": "2025-10-13", "input": 218000, "output": 56000 },
        { "date": "2025-10-14", "input": 281000, "output": 72000 },
        { "date": "2025-10-15", "input": 316000, "output": 81000 }
      ]
    },
    "tools": {
      "get_schedule": [
        { "date": "2025-10-08", "count": 89 },
        { "date": "2025-10-09", "count": 98 },
        // ... (remaining dates)
      ],
      "calculate_travel_times": [
        { "date": "2025-10-08", "count": 34 },
        { "date": "2025-10-09", "count": 41 },
        // ... (remaining dates)
      ],
      "get_player_stats": [
        { "date": "2025-10-08", "count": 12 },
        { "date": "2025-10-09", "count": 15 },
        // ... (remaining dates)
      ]
    }
  }
}
```

**Error Responses**:

**400 Bad Request** (Invalid date range):
```json
{
  "error": "invalid_date_range",
  "message": "start_date must be before end_date",
  "details": {
    "start_date": "2025-10-15",
    "end_date": "2025-10-08"
  }
}
```

**400 Bad Request** (Date range too large):
```json
{
  "error": "date_range_too_large",
  "message": "Date range must not exceed 90 days",
  "details": {
    "requested_days": 120,
    "max_days": 90
  }
}
```

**500 Internal Server Error** (Redis unavailable):
```json
{
  "error": "storage_unavailable",
  "message": "Unable to retrieve metrics. Please try again later."
}
```

**TypeScript Interface**:
```typescript
export interface AnalyticsRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  metrics?: string[]; // Optional: filter specific metrics
  granularity?: "daily" | "weekly" | "monthly";
}

export interface AnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  granularity: "daily" | "weekly" | "monthly";
  metrics: {
    conversations?: Array<{ date: string; count: number }>;
    tokens?: Record<string, Array<{ date: string; input: number; output: number }>>;
    tools?: Record<string, Array<{ date: string; count: number }>>;
  };
}
```

---

### 2. GET /api/analytics/cost

**Description**: Calculate estimated API costs for a date range.

**Authentication**: None (MVP) or Environment variable check (future)

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| start_date | string | Yes | Start date (ISO format YYYY-MM-DD) | `2025-10-01` |
| end_date | string | Yes | End date (ISO format YYYY-MM-DD) | `2025-10-31` |
| model | string | No | AI model name (default: all models) | `gemini-2.5-flash` |

**Request Example**:
```http
GET /api/analytics/cost?start_date=2025-10-01&end_date=2025-10-31&model=gemini-2.5-flash
```

**Success Response** (200 OK):
```json
{
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  "model": "gemini-2.5-flash",
  "token_usage": {
    "input_tokens": 7542000,
    "output_tokens": 1923000,
    "total_tokens": 9465000
  },
  "pricing": {
    "input_price_per_million": 0.30,
    "output_price_per_million": 2.50
  },
  "cost_breakdown": {
    "input_cost": 2.26,
    "output_cost": 4.81,
    "total_cost": 7.07
  },
  "projected_monthly_cost": 7.07,
  "daily_average": {
    "tokens": 305322,
    "cost": 0.23
  }
}
```

**Error Responses**:

**400 Bad Request** (Invalid model):
```json
{
  "error": "invalid_model",
  "message": "Model 'gpt-4' not found in analytics data",
  "details": {
    "available_models": ["gemini-2.5-flash"]
  }
}
```

**TypeScript Interface**:
```typescript
export interface CostRequest {
  start_date: string;
  end_date: string;
  model?: string;
}

export interface CostResponse {
  period: {
    start: string;
    end: string;
  };
  model: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  pricing: {
    input_price_per_million: number;
    output_price_per_million: number;
  };
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
  projected_monthly_cost: number;
  daily_average: {
    tokens: number;
    cost: number;
  };
}
```

---

### 3. GET /api/analytics/feature-breakdown

**Description**: Get feature usage breakdown (percentage of total activity by tool).

**Authentication**: None (MVP) or Environment variable check (future)

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| start_date | string | Yes | Start date (ISO format YYYY-MM-DD) | `2025-10-08` |
| end_date | string | Yes | End date (ISO format YYYY-MM-DD) | `2025-10-15` |

**Request Example**:
```http
GET /api/analytics/feature-breakdown?start_date=2025-10-08&end_date=2025-10-15
```

**Success Response** (200 OK):
```json
{
  "period": {
    "start": "2025-10-08",
    "end": "2025-10-15"
  },
  "total_tool_calls": 1247,
  "breakdown": [
    {
      "tool_name": "get_schedule",
      "count": 812,
      "percentage": 65.1
    },
    {
      "tool_name": "calculate_travel_times",
      "count": 312,
      "percentage": 25.0
    },
    {
      "tool_name": "get_player_stats",
      "count": 89,
      "percentage": 7.1
    },
    {
      "tool_name": "get_team_stats",
      "count": 34,
      "percentage": 2.7
    }
  ]
}
```

**TypeScript Interface**:
```typescript
export interface FeatureBreakdownRequest {
  start_date: string;
  end_date: string;
}

export interface FeatureBreakdownResponse {
  period: {
    start: string;
    end: string;
  };
  total_tool_calls: number;
  breakdown: Array<{
    tool_name: string;
    count: number;
    percentage: number; // 0-100
  }>;
}
```

---

### 4. GET /api/analytics/performance

**Description**: Get performance metrics (response times, error rates, uptime).

**Authentication**: None (MVP) or Environment variable check (future)

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| start_date | string | Yes | Start date (ISO format YYYY-MM-DD) | `2025-10-08` |
| end_date | string | Yes | End date (ISO format YYYY-MM-DD) | `2025-10-15` |
| endpoint | string | No | Filter by endpoint (default: all) | `/api/hockey-chat` |

**Request Example**:
```http
GET /api/analytics/performance?start_date=2025-10-08&end_date=2025-10-15&endpoint=/api/hockey-chat
```

**Success Response** (200 OK):
```json
{
  "period": {
    "start": "2025-10-08",
    "end": "2025-10-15"
  },
  "endpoint": "/api/hockey-chat",
  "metrics": {
    "response_times": {
      "p50": 1180,
      "p95": 2340,
      "p99": 3890
    },
    "requests": {
      "total": 1247,
      "successful": 1238,
      "failed": 9
    },
    "error_rate": 0.7,
    "uptime_percentage": 99.3
  },
  "daily_breakdown": [
    {
      "date": "2025-10-08",
      "response_time_p95": 2410,
      "error_count": 2,
      "success_count": 125
    },
    // ... (remaining dates)
  ]
}
```

**TypeScript Interface**:
```typescript
export interface PerformanceRequest {
  start_date: string;
  end_date: string;
  endpoint?: string;
}

export interface PerformanceResponse {
  period: {
    start: string;
    end: string;
  };
  endpoint: string;
  metrics: {
    response_times: {
      p50: number; // milliseconds
      p95: number;
      p99: number;
    };
    requests: {
      total: number;
      successful: number;
      failed: number;
    };
    error_rate: number; // percentage (0-100)
    uptime_percentage: number; // percentage (0-100)
  };
  daily_breakdown: Array<{
    date: string;
    response_time_p95: number;
    error_count: number;
    success_count: number;
  }>;
}
```

---

## Shared Types

### Error Response Format

All endpoints use consistent error response structure:

```typescript
export interface ErrorResponse {
  error: string; // Machine-readable error code
  message: string; // Human-readable error message
  details?: Record<string, any>; // Optional additional context
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_date_range` | 400 | start_date is after end_date |
| `date_range_too_large` | 400 | Date range exceeds 90 days |
| `invalid_granularity` | 400 | Granularity must be daily/weekly/monthly |
| `invalid_model` | 400 | Model name not found in analytics |
| `storage_unavailable` | 500 | Redis connection failed |
| `internal_error` | 500 | Unexpected server error |

---

## Rate Limiting

**MVP**: No rate limiting (trusted internal use)
**Future**: Implement rate limiting using `@upstash/ratelimit`:
- **Dashboard**: 30 requests per minute per IP
- **Cost endpoint**: 10 requests per minute per IP

---

## Caching Strategy

**Client-Side Caching**:
- Dashboard should cache responses for 30 seconds
- Use `Cache-Control: max-age=30` header
- Stale-while-revalidate pattern for better UX

**Server-Side Caching**:
- Redis MGET results cached in memory for 30 seconds
- Cache key: `analytics:cache:${endpoint}:${queryHash}`

---

## Testing Requirements

### Contract Tests

1. **Valid requests return 200**:
   - Test all query parameter combinations
   - Verify response schema matches TypeScript interfaces

2. **Invalid requests return 400**:
   - Test invalid date formats
   - Test date ranges >90 days
   - Test unknown metric types

3. **Redis failures return 500**:
   - Mock Redis unavailability
   - Verify graceful degradation

4. **Date range edge cases**:
   - Single day (start_date === end_date)
   - Leap year handling
   - DST transition dates

5. **Privacy compliance**:
   - Assert no PII in responses
   - Verify aggregate-only data

### Performance Tests

- Endpoint response time <500ms (P95) for 7-day range
- Endpoint response time <2s (P95) for 90-day range
- Concurrent requests (10 simultaneous) don't cause timeouts

---

## Security Considerations

### Input Validation

- **Date format**: Must match `YYYY-MM-DD` regex
- **Date range**: Max 90 days to prevent DOS attacks
- **SQL injection**: N/A (Redis key-value store, no SQL)
- **Path traversal**: N/A (no file system access)

### Authentication (Future)

**Option A** (Environment Variable):
```typescript
// middleware.ts
if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}
```

**Option B** (IP Whitelist):
```typescript
const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
if (!allowedIPs.includes(req.ip)) {
  return Response.json({ error: 'forbidden' }, { status: 403 });
}
```

---

## Implementation Checklist

- [ ] Create `/app/api/analytics/route.ts` (main endpoint)
- [ ] Create `/app/api/analytics/cost/route.ts` (cost calculation)
- [ ] Create `/app/api/analytics/feature-breakdown/route.ts` (tool usage)
- [ ] Create `/app/api/analytics/performance/route.ts` (health metrics)
- [ ] Add TypeScript interfaces to `/lib/analytics/types.ts`
- [ ] Implement Redis query functions in `/lib/analytics/queries.ts`
- [ ] Add input validation using Zod schemas
- [ ] Write contract tests in `/tests/api/analytics.test.ts`
- [ ] Run `pnpm tsc --noEmit` to verify type safety
- [ ] Test all endpoints with sample data

---

## Related Files

- **Data Model**: `/specs/006-privacy-analytics-dashboard/data-model.md`
- **Research**: `/specs/006-privacy-analytics-dashboard/research.md`
- **Quickstart**: `/specs/006-privacy-analytics-dashboard/quickstart.md`
