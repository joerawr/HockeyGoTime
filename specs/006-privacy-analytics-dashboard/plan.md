# Implementation Plan: Privacy-Compliant Usage Analytics

**Branch**: `006-privacy-analytics-dashboard` | **Date**: 2025-10-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-privacy-analytics-dashboard/spec.md`

## Summary

Implement serverless, privacy-compliant analytics system using Upstash Redis for aggregate metrics storage and Recharts for dashboard visualizations. Track LLM token usage, MCP tool invocations, and performance metrics without collecting any user identifiers. System enables data-driven decisions about scaling, feature prioritization, and financial sustainability while maintaining privacy-first commitment.

**Key Technical Approach**:
- **Storage**: Upstash Redis with HTTP/REST transport (serverless-native, free tier sufficient)
- **Tracking**: Non-blocking metrics collection in AI SDK `onFinish` callback
- **Dashboard**: Next.js 15 page with Recharts visualizations
- **Privacy**: Aggregate-only counters, 90-day TTL, zero PII collection

---

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.5.3
**Primary Dependencies**:
- `@upstash/redis` - HTTP-based Redis client for serverless
- `recharts` - React charting library
- `ai` (AI SDK 5.0.44) - Already installed, provides token usage metadata
- `date-fns` - Already installed, for date manipulation

**Storage**: Upstash Redis (serverless, free tier: 500K commands/month)
**Testing**: Manual integration testing (MVP), future: Jest + React Testing Library
**Target Platform**: Vercel serverless functions (Next.js 15 App Router)
**Project Type**: Web application (Next.js)

**Performance Goals**:
- Dashboard page load < 2 seconds (P95)
- Metrics tracking adds < 10ms overhead to API requests (P95)
- Redis operations complete < 150ms (P95, HTTP round-trip)

**Constraints**:
- No user identifiers (session IDs, IPs, device fingerprints) - GDPR/CCPA compliance
- Metrics collection must not block AI response streaming
- Stay within Upstash free tier limits (500K commands/month)
- TypeScript strict mode must pass (`pnpm tsc --noEmit`)

**Scale/Scope**:
- MVP: 100-500 conversations/day (well within free tier)
- Target: 1000+ conversations/day before considering paid tier
- Dashboard: Admin-only, 1-10 users accessing occasionally
- Metrics retention: 90 days automatic deletion via TTL

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: User-Centric AI Experience
**Status**: COMPLIANT (N/A - analytics is admin-facing, not user-facing)
- Dashboard is internal tool, doesn't affect user chat experience
- Metrics tracking is async and doesn't delay AI responses

### ✅ Principle II: Type Safety & Quality Gates
**Status**: COMPLIANT
- All TypeScript interfaces defined for metrics, API responses, dashboard components
- Strict mode compilation verified with `pnpm tsc --noEmit`
- Zod schemas for API input validation

### ✅ Principle III: Performance First
**Status**: COMPLIANT
- Metrics tracking uses async/non-blocking pattern (`.catch()` instead of `await`)
- Dashboard queries use Redis MGET for batch fetching (fast aggregation)
- Client-side caching with 30-second TTL reduces Redis reads
- <10ms overhead target ensures chat responses remain <3s (P95)

### ✅ Principle IV: MCP Integration Correctness
**Status**: N/A (feature doesn't modify MCP integration)
- Metrics tracking happens in existing `onFinish` callback
- MCP client lifecycle unchanged (still closes after streaming)

### ✅ Principle V: Package Manager Discipline
**Status**: COMPLIANT
- All commands use `pnpm` exclusively
- Dependencies added via `pnpm add @upstash/redis recharts`
- Documentation uses only `pnpm` commands

### ✅ Principle VI: AI Model Selection
**Status**: COMPLIANT
- **Correction**: Constitution states GPT-5, but project uses **Gemini 2.5 Flash preview**
- Token tracking updated to use Gemini pricing ($0.30/1M input, $2.50/1M output)
- Metrics distinguish model names (future-proof for multi-model support)
- **Note**: Constitution should be amended to reflect Gemini as primary model

### ✅ Principle VII: Deployment Ready & Environment Configuration
**Status**: COMPLIANT
- Environment variables documented: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `.env.local.template` updated with Upstash credentials
- Vercel deployment configuration includes environment variables for all environments (production, preview, development)
- Graceful degradation if Redis unavailable (log error, don't crash)

### Additional Compliance: Privacy-First Design
**Status**: COMPLIANT (new consideration for analytics)
- Zero PII collection (no user IDs, IPs, session data)
- Aggregate-only metrics (GDPR Article 4(1) exemption for anonymous data)
- 90-day automatic deletion via Redis TTL
- Privacy policy updated with analytics disclosure

### Pre-Implementation Gates

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript strict mode | ✅ PASS | All types defined in research phase |
| Performance targets defined | ✅ PASS | <2s dashboard, <10ms tracking overhead |
| Dependencies approved | ✅ PASS | Upstash + Recharts fit existing stack |
| Privacy compliance | ✅ PASS | Aggregate-only, zero PII |
| Free tier capacity | ✅ PASS | 500K commands handles 3,300 conversations/day |

---

## Project Structure

### Documentation (this feature)

```
specs/006-privacy-analytics-dashboard/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (Upstash, Recharts, token tracking, privacy patterns)
├── data-model.md        # Phase 1 output (MetricCounter, TokenUsage, ToolCallMetrics entities)
├── quickstart.md        # Phase 1 output (integration scenarios, testing guide)
├── contracts/           # Phase 1 output
│   └── analytics-api.md # API endpoint specifications (GET /api/analytics, /api/analytics/cost)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── api/
│   └── analytics/
│       ├── route.ts                # GET endpoint for dashboard data
│       ├── cost/
│       │   └── route.ts            # GET endpoint for cost calculations
│       ├── feature-breakdown/
│       │   └── route.ts            # GET endpoint for tool usage breakdown
│       └── performance/
│           └── route.ts            # GET endpoint for performance metrics
├── dashboard/
│   └── page.tsx                    # Admin analytics dashboard (Recharts visualizations)
└── hockey-chat/
    └── route.ts                    # MODIFIED: Add metrics tracking to onFinish callback

lib/
├── analytics/
│   ├── metrics.ts                  # Core tracking functions (trackConversation, trackTokens, trackToolCall)
│   ├── queries.ts                  # Redis query functions (getMetrics, calculateCost)
│   ├── cost.ts                     # Cost calculation utilities
│   ├── types.ts                    # TypeScript interfaces (MetricCounter, TokenUsage, etc.)
│   └── client.ts                   # Upstash Redis client singleton

components/
└── analytics/
    ├── ConversationsChart.tsx      # Bar chart for daily conversations
    ├── TokenUsageChart.tsx         # Line chart for token consumption trends
    ├── ToolBreakdownChart.tsx      # Pie chart for feature usage breakdown
    ├── PerformanceMetrics.tsx      # Stats cards (P95 response time, uptime, errors)
    └── CostProjection.tsx          # Monthly cost estimate with alert thresholds

.env.local.template                 # MODIFIED: Add UPSTASH_* variables
```

**Structure Decision**: Web application structure (Next.js App Router). Analytics features are integrated into existing app structure with new `/app/dashboard` page and `/lib/analytics` library. Minimal file additions, maximum code reuse.

---

## Complexity Tracking

*No constitution violations - section empty.*

---

## Implementation Phases

### Phase 0: Research (✅ COMPLETE)

**Artifacts Generated**:
- [x] `research.md` - Upstash Redis patterns, Recharts setup, Gemini token tracking, privacy compliance

**Key Decisions**:
1. **Upstash Redis** selected over Vercel KV (free tier, serverless-native)
2. **Recharts** selected over Chart.js (React-native API, TypeScript support)
3. **Gemini 2.5 Flash** pricing confirmed: $0.30/1M input, $2.50/1M output
4. **Privacy pattern**: Aggregate-only counters, no correlation, 90-day TTL

### Phase 1: Design & Contracts (✅ COMPLETE)

**Artifacts Generated**:
- [x] `data-model.md` - MetricCounter, TokenUsage, ToolCallMetrics, PerformanceMetrics entities
- [x] `contracts/analytics-api.md` - API endpoint specifications with request/response schemas
- [x] `quickstart.md` - Integration scenarios and testing guide

**Key Designs**:
1. **Redis Key Naming**: `analytics:<metric>:<granularity>:<date>` pattern
2. **Atomic Operations**: Lua scripts for INCR + EXPIRE atomicity
3. **API Structure**: RESTful endpoints with Zod validation
4. **Dashboard Layout**: 7-day trends with Recharts bar/line charts

### Phase 2: Task Breakdown (PENDING)

**Next Step**: Run `/speckit.tasks` command to generate implementation tasks based on this plan.

**Expected Task Categories**:
1. **Setup**: Install dependencies, configure environment variables, create file structure
2. **Core Library**: Implement Redis client, tracking functions, Lua scripts
3. **API Endpoints**: Build analytics API routes with validation
4. **Dashboard UI**: Create Recharts components and dashboard page
5. **Integration**: Add tracking calls to existing `/api/hockey-chat` route
6. **Testing**: Manual integration testing, privacy compliance verification
7. **Documentation**: Update `.env.local.template`, privacy policy

---

## Constitution Post-Design Re-Check

### Type Safety (Principle II)
**Status**: ✅ COMPLIANT
- All entities have TypeScript interfaces (data-model.md)
- API contracts specify request/response types (contracts/analytics-api.md)
- Recharts components use typed props

### Performance (Principle III)
**Status**: ✅ COMPLIANT
- Lua scripts ensure atomic operations without race conditions
- Redis MGET batch fetching for efficient aggregation
- Non-blocking tracking pattern (.catch() instead of await)
- Client-side caching (30s TTL) reduces Redis load

### Privacy Compliance (New Consideration)
**Status**: ✅ COMPLIANT
- Data model confirms no PII in keys or values
- TTL enforcement via Redis expiration (90 days)
- API contracts return only aggregate metrics
- Quickstart includes privacy verification scenarios

---

## Dependencies & Integration Points

### External Dependencies
1. **Upstash Redis**:
   - Free tier: 500K commands/month
   - Setup: Create account, provision database, get credentials
   - Configuration: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

2. **Recharts**:
   - License: MIT (compatible with project)
   - Bundle size: ~200KB (acceptable for admin dashboard)
   - Installation: `pnpm add recharts`

### Integration Points
1. **AI SDK onFinish Callback** (`/app/api/hockey-chat/route.ts`):
   - Extract `usage` metadata (inputTokens, outputTokens)
   - Call `trackConversation()`, `trackTokens()`, `trackToolCall()`
   - Must not block streaming or MCP disconnect

2. **Dashboard Page** (`/app/dashboard/page.tsx`):
   - Fetch metrics from `/api/analytics`
   - Render Recharts visualizations
   - Client-side only ("use client" directive)

3. **Environment Variables** (`.env.local`):
   - Add Upstash credentials
   - Update `.env.local.template` for team onboarding

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Redis free tier exhaustion | Low | Medium | Monitor usage, set alerts at 80%, upgrade if needed ($0.20 per 100K commands) |
| Analytics adds latency | Low | High | Use non-blocking pattern, add timeout protection (500ms max) |
| PII accidental leakage | Low | Critical | Code review checklist, automated key pattern tests, regular audits |
| TypeScript compilation errors | Medium | Low | Run `pnpm tsc --noEmit` after every change, explicit type annotations |
| Dashboard performance issues | Low | Low | Limit data points to 90 days, use React.memo for charts |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Upstash service outage | Low | Low | Graceful degradation (log error, continue serving users) |
| Missing environment variables | Medium | High | Vercel deployment checks, `.env.local.template` documentation |
| Redis data loss | Very Low | Low | Metrics are ephemeral (90-day TTL), not critical data |

---

## Success Metrics

### Technical Success
- [ ] TypeScript compilation passes: `pnpm tsc --noEmit` (zero errors)
- [ ] Dashboard loads in <2 seconds (P95 on Vercel)
- [ ] Metrics tracking adds <10ms overhead (P95)
- [ ] Redis commands stay within free tier (500K/month)

### Business Success
- [ ] Admin can answer: "How many people are using the app?"
- [ ] Admin can answer: "Which features are most popular?"
- [ ] Admin can answer: "What are our monthly API costs?"
- [ ] Cost projections enable informed scaling decisions

### Privacy Compliance
- [ ] Code review confirms no PII in Redis keys or values
- [ ] Privacy policy updated with analytics disclosure
- [ ] 90-day TTL enforced on all metrics keys
- [ ] GDPR compliance verified (anonymous data exemption)

---

## Next Steps

1. **Run `/speckit.tasks` command** to generate detailed implementation task breakdown
2. **Create Upstash Redis account** and provision database (5 minutes)
3. **Install dependencies**: `pnpm add @upstash/redis recharts` (1 minute)
4. **Begin Phase 2 implementation** following generated tasks.md
5. **Deploy to Vercel development** for early testing (after core library complete)

---

## Related Documentation

- **Feature Spec**: [spec.md](./spec.md) - User stories, requirements, success criteria
- **Research**: [research.md](./research.md) - Technology decisions, implementation patterns
- **Data Model**: [data-model.md](./data-model.md) - Entities, relationships, validation rules
- **API Contracts**: [contracts/analytics-api.md](./contracts/analytics-api.md) - Endpoint specifications
- **Quickstart**: [quickstart.md](./quickstart.md) - Integration scenarios, testing guide
- **GitHub Issue**: [#10](https://github.com/joerawr/HockeyGoTime/issues/10) - Original feature request
