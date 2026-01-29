# Research: Privacy-Compliant Analytics Implementation

**Feature**: 006-privacy-analytics-dashboard
**Date**: 2025-10-15
**Research Phase**: Complete

## Executive Summary

This research covers four key technologies for implementing serverless, privacy-compliant analytics in HockeyGoTime: Upstash Redis for metrics storage, Recharts for dashboard visualizations, Gemini 2.5 Flash token tracking via AI SDK 5, and GDPR-compliant aggregate-only patterns. All selected technologies fit within the existing Next.js 15 + Vercel serverless architecture with minimal additional dependencies.

---

## Decision 1: Upstash Redis for Serverless Metrics Storage

### Decision
Use Upstash Redis (@upstash/redis) with HTTP/REST transport for storing aggregate metrics.

### Rationale
- **Serverless-native**: HTTP-based, no persistent connections needed (perfect for Vercel functions)
- **Free tier sufficient**: 500K commands/month handles 1000+ conversations/day comfortably
- **Atomic operations**: Lua scripts prevent race conditions in metrics collection
- **Built-in TTL**: Automatic 90-day data retention via key expiration
- **Low latency**: Global replication reduces response times to 50-150ms

### Alternatives Considered
1. **Vercel KV** (Redis-compatible edge storage):
   - **Rejected**: $10/month minimum (no free tier), overkill for MVP
   - Vercel-specific lock-in without additional value

2. **Supabase Postgres** (already used for venue data):
   - **Rejected**: Not optimized for high-frequency counter updates
   - Requires complex SQL queries for time-series aggregation
   - PostgreSQL connections don't suit serverless burst traffic

3. **Simple file logs** (write to /tmp or external storage):
   - **Rejected**: Vercel functions are stateless, /tmp not shared across instances
   - Requires separate aggregation job, adds complexity
   - Can't efficiently query historical trends

### Implementation Pattern

**Atomic Increment with TTL (Lua script)**:
```typescript
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

**Key Naming Convention**:
```
analytics:<metric>:<granularity>:<date>
analytics:conversations:daily:2025-10-15
analytics:tokens:gemini-2.5-flash:input:daily:2025-10-15
analytics:tools:get_schedule:daily:2025-10-15
```

### Free Tier Limits & Capacity Planning
- **500K commands/month** = ~16,600 commands/day
- Per conversation (estimate):
  - 1 conversation counter increment
  - 2 token counters (input + output)
  - 1-3 tool call counters (average 2)
  - **Total: ~5 commands/conversation**
- **Capacity**: 16,600 / 5 = **~3,300 conversations/day** before hitting limits
- Current target (MVP): 100-500 conversations/day → **well within free tier**

---

## Decision 2: Recharts for React Dashboard Visualizations

### Decision
Use Recharts (recharts) for building analytics dashboard charts.

### Rationale
- **React-native API**: Declarative JSX syntax, no manual DOM manipulation
- **Excellent TypeScript support**: Full type definitions included
- **Responsive by default**: ResponsiveContainer handles screen sizes automatically
- **Sufficient chart types**: Bar charts, line charts, and area charts cover MVP needs
- **Lightweight**: ~200KB bundle size (acceptable for admin dashboard)

### Alternatives Considered
1. **Chart.js**:
   - **Rejected**: Requires refs and imperative API, less React-friendly
   - TypeScript support requires @types/chart.js (not as integrated)
   - More manual work for responsive design

2. **Victory**:
   - **Rejected**: Heavier bundle size (~600KB), more complex API
   - Overkill for simple MVP dashboard needs

3. **D3.js directly**:
   - **Rejected**: Steep learning curve, imperative API
   - Too much manual work for standard chart types
   - Not worth the flexibility trade-off for MVP

### Implementation Example

**Basic Bar Chart (Daily Conversations)**:
```typescript
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ConversationsChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Performance Optimization**:
- Use `React.memo()` to prevent unnecessary re-renders
- Limit data points to 30-90 days max for responsive rendering
- Consider data aggregation for longer time ranges (weekly/monthly rollups)

---

## Decision 3: Gemini 2.5 Flash Token Tracking via AI SDK 5

### Decision
Extract token usage from AI SDK 5 `onFinish` callback and track asynchronously.

### Rationale
- **Built-in metadata**: AI SDK 5 provides `usage` object with input/output token counts
- **Non-blocking tracking**: Fire-and-forget analytics in `onFinish` doesn't impact response streaming
- **Accurate pricing**: Gemini 2.5 Flash costs $0.30/1M input, $2.50/1M output tokens
- **Already integrated**: No additional LLM API calls needed

### Current Pricing (Gemini 2.5 Flash)
- **Input tokens**: $0.30 per 1M tokens
- **Output tokens**: $2.50 per 1M tokens
- **Context window**: 1M tokens
- **Speed**: 170.9 tokens/second, 0.32s TTFT

**Cost estimation** (typical conversation):
- Input: ~2000 tokens (system prompt + user message + context)
- Output: ~500 tokens (agent response)
- **Cost per conversation**: (2000/1M × $0.30) + (500/1M × $2.50) = **$0.00185** (~$0.002)
- **1000 conversations/month**: ~$1.85

### Implementation Pattern

**Update `/app/api/hockey-chat/route.ts` onFinish callback**:
```typescript
import { trackConversation, trackToolCall, trackTokens } from "@/lib/analytics/metrics";

onFinish: async ({ text, toolCalls, toolResults, steps, usage }) => {
  // Existing logging...

  // NEW: Track analytics asynchronously (don't await - use .catch() for errors)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  trackConversation(today).catch(console.error);

  if (toolCalls && toolCalls.length > 0) {
    for (const call of toolCalls) {
      trackToolCall(call.toolName, today).catch(console.error);
    }
  }

  if (usage) {
    const { inputTokens, outputTokens } = usage;
    trackTokens("gemini-2.5-flash", inputTokens, outputTokens, today).catch(console.error);

    const cost = (inputTokens / 1_000_000) * 0.30 + (outputTokens / 1_000_000) * 2.50;
    console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);
  }

  // Existing MCP client disconnect...
},
```

**Why non-blocking** (`.catch()` instead of `await`):
- Analytics failures shouldn't block AI response delivery
- User experience takes priority over metrics collection
- Vercel function timeout (10s default) must be reserved for streaming

### Alternatives Considered
1. **Middleware-based tracking**:
   - **Rejected**: Can't access AI SDK usage metadata from middleware
   - Would require separate token counting logic (error-prone)

2. **Database-based logging** (PostgreSQL/Supabase):
   - **Rejected**: Too slow for high-frequency writes (adds 50-100ms per request)
   - Overkill for simple counters, Redis is better optimized

---

## Decision 4: Privacy-Compliant Aggregate-Only Patterns

### Decision
Track only aggregate metrics with no user identifiers, complying with GDPR/CCPA without consent requirements.

### Rationale
- **Truly anonymous**: Aggregate counters can't be reverse-engineered to identify users
- **No consent required**: GDPR Article 4(1) exempts anonymous data from PII regulations
- **Aligned with privacy policy**: HockeyGoTime explicitly promises no user tracking
- **Simple implementation**: No session management, fingerprinting, or complex compliance logic

### Compliant Metric Categories

**✅ Safe to track (aggregate only)**:
- Daily conversation counts
- Tool call counts by tool name
- Token usage by model (input/output)
- Page load counts by route
- Error rates by endpoint
- Cache hit/miss ratios
- P95/P99 response times

**❌ Never track (contains PII)**:
- User-specific conversation history
- IP addresses or geolocation
- Session IDs or device fingerprints
- User query content or preferences
- Email addresses or user accounts

### Key Design Pattern: No Correlation

**Wrong** (creates user profile):
```typescript
// ❌ BAD: Can reconstruct user behavior
const sessionKey = `analytics:session:${sessionId}:tools`;
await redis.sadd(sessionKey, toolName); // Violates privacy
```

**Correct** (pure aggregation):
```typescript
// ✅ GOOD: No way to trace back to individual users
const toolKey = `analytics:tools:${toolName}:daily:${date}`;
await redis.incr(toolKey); // Just a counter
```

### Data Retention Policy

- **90-day automatic expiration** via Redis TTL
- No manual cleanup needed (keys auto-delete after retention period)
- Complies with GDPR data minimization principle

### Privacy Policy Disclosure

**Example language** (to add to `/app/privacy/page.tsx`):

> "We collect anonymous, aggregate analytics to monitor service health:
> - Daily conversation counts (no user identifiers)
> - Tool usage statistics (no query content)
> - Token consumption metrics (no individual tracking)
>
> This data is automatically deleted after 90 days and contains no personally identifiable information."

### Alternatives Considered
1. **HyperLogLog for unique user estimation**:
   - **Rejected**: Even cardinality estimation could be considered user tracking
   - Privacy policy explicitly states "we don't know how often you visit"

2. **Session-based metrics without identifiers**:
   - **Rejected**: Session correlation (even anonymous) could reconstruct behavior patterns
   - Violates "events, not people" principle

3. **Third-party analytics (Google Analytics, Plausible)**:
   - **Rejected**: Introduces external tracking dependencies
   - Even privacy-focused tools like Plausible track more than needed
   - Prefer full control over data collection

---

## Implementation Architecture

### Data Flow

```
User Request → /api/hockey-chat
              ↓
         streamText() with onFinish callback
              ↓
         [Stream completes]
              ↓
    onFinish: Extract usage metadata
              ↓
    trackConversation() → Upstash Redis (async)
    trackToolCall()     → Upstash Redis (async)
    trackTokens()       → Upstash Redis (async)
              ↓
         [Don't await - fire and forget]
              ↓
    MCP client disconnect (must await)
```

### File Structure

```
lib/analytics/
├── metrics.ts           # Core tracking functions (trackConversation, trackToolCall, trackTokens)
├── retention.ts         # TTL management and key cleanup
└── types.ts             # TypeScript types for metrics

app/api/analytics/
└── route.ts             # GET endpoint for dashboard data

app/dashboard/
└── page.tsx             # Admin analytics dashboard (Recharts visualizations)

components/analytics/
├── ConversationsChart.tsx  # Bar chart for daily conversations
├── TokenUsageChart.tsx     # Line chart for token trends
├── ToolUsageChart.tsx      # Pie chart for feature breakdown
└── PerformanceMetrics.tsx  # Stats cards for P95, errors, uptime
```

### Environment Variables

Add to `.env.local`:
```bash
# Upstash Redis (get from https://console.upstash.com)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## Risks & Mitigation

### Risk 1: Redis Free Tier Exhaustion
**Likelihood**: Low (500K commands handles 3,300 conversations/day)
**Impact**: Medium (metrics collection stops, but app continues working)
**Mitigation**:
- Monitor command usage via Upstash dashboard
- Set up alert when approaching 80% of limit
- Upgrade to paid plan ($0.20 per 100K commands) if needed

### Risk 2: Analytics Latency Impact
**Likelihood**: Low (Redis operations are async and don't block responses)
**Impact**: High (could slow down AI responses if blocking)
**Mitigation**:
- Use `.catch()` instead of `await` for analytics calls
- Add timeout protection (abort Redis call after 500ms)
- Log errors but never throw to prevent cascading failures

### Risk 3: PII Accidental Leakage
**Likelihood**: Low (design explicitly prevents PII in keys/values)
**Impact**: Critical (GDPR violation, privacy policy breach)
**Mitigation**:
- Code review checklist: verify no user IDs, IPs, or session data in keys
- Automated test: assert all Redis keys match allowed patterns
- Regular audits: manual review of Redis keys in production

### Risk 4: TypeScript Compilation Errors
**Likelihood**: Medium (Recharts types can be finicky)
**Impact**: Low (blocks deployment but easy to fix)
**Mitigation**:
- Run `pnpm tsc --noEmit` before every commit (constitution requirement)
- Add explicit type annotations for chart data structures
- Use provided TypeScript examples from research

---

## Success Criteria

### Technical Success
- ✅ `pnpm tsc --noEmit` passes with zero errors
- ✅ Dashboard loads in <2 seconds (P95)
- ✅ Metrics tracking adds <10ms overhead to API requests
- ✅ Redis commands stay within free tier limits (500K/month)

### Privacy Compliance
- ✅ Code review confirms no PII in Redis keys or values
- ✅ Privacy policy updated with analytics disclosure
- ✅ 90-day TTL enforced on all metrics keys
- ✅ Can demonstrate GDPR compliance to legal review

### User Value
- ✅ Admin can answer: "How many people are using the app?"
- ✅ Admin can answer: "Which features are most popular?"
- ✅ Admin can answer: "What are our monthly API costs?"
- ✅ Dashboard provides actionable insights for roadmap prioritization

---

## Open Questions

### Q1: Dashboard Authentication
**Question**: How should the analytics dashboard be protected?
**Options**:
- A) Environment variable check (e.g., `ADMIN_SECRET=password123`)
- B) IP whitelist (Vercel supports this)
- C) Full authentication system (overkill for MVP)
- D) Make dashboard public (transparency approach)

**Recommendation**: Start with option A (environment variable) for MVP simplicity. Can upgrade to full auth later if needed.

### Q2: Real-Time vs Batch Updates
**Question**: Should dashboard data be real-time or cached?
**Current thinking**: Cache dashboard data for 30 seconds to reduce Redis reads. Acceptable trade-off for MVP (analytics don't need live updates).

### Q3: Weekly/Monthly Rollups
**Question**: Should daily metrics be automatically aggregated into weekly/monthly counters?
**Current thinking**: Defer to post-MVP. Dashboard can compute aggregates on-demand from daily keys (Redis MGET is fast enough for 90 days of data).

---

## Next Steps

1. **Phase 0 Complete**: ✅ Research findings documented
2. **Phase 1 Next**: Generate data-model.md (MetricCounter, CostEstimate entities)
3. **Phase 1 Next**: Generate contracts/ (API endpoint specifications)
4. **Phase 1 Next**: Generate quickstart.md (integration scenarios for analytics tracking)
5. **Phase 2 (separate command)**: Run `/speckit.tasks` to generate implementation tasks

---

## References

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Recharts Documentation](https://recharts.org/en-US/)
- [AI SDK 5 Usage Tracking](https://sdk.vercel.ai/docs/ai-sdk-core/telemetry)
- [GDPR Anonymous Data Guidelines](https://gdpr.eu/article-4-definitions/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
