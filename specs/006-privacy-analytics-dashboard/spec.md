# Feature Specification: Privacy-Compliant Usage Analytics and Metrics Dashboard

**Feature Branch**: `006-privacy-analytics-dashboard`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User request: "I want to start to release this to general users, and I need a way to track usage, stats, costs while still keeping it private."

## Problem Statement

Currently, HockeyGoTime has zero visibility into usage, adoption, or infrastructure scaling needs. Without tracking individual users (per our privacy guarantees), we need alternative metrics to understand:

- **Are people actually using the app?** (engagement validation)
- **Which features are popular?** (roadmap prioritization)
- **When do we need to scale infrastructure?** (capacity planning)
- **What are the API costs?** (financial sustainability)

Our privacy policy explicitly states we don't track users, don't use analytics, and don't know "how often you visit." We need metrics that respect these guarantees while still providing actionable insights.

## Solution Overview

Implement aggregate, privacy-compliant metrics that track **events, not people**. Use Upstash Redis (serverless, free tier) to store daily/weekly/monthly counters with no user identifiers. Build a simple dashboard to visualize trends and inform infrastructure decisions.

**Core Principle**: Think of it like a physical store counting transactions without tracking individual shoppers.

## User Scenarios & Testing

### User Story 1 - Admin Views Usage Metrics Dashboard (Priority: P1)

An administrator navigates to `/admin/analytics` and views a dashboard showing the past 7 days of HockeyGoTime usage: total LLM tokens consumed, number of conversations (estimated from token patterns), feature breakdown (schedule vs stats vs travel), and performance metrics (P95 response time, uptime percentage).

**Why this priority**: Visibility into current usage is critical before launching to general users. Must understand baseline engagement and cost burn rate.

**Independent Test**: Can be tested by seeding Redis with mock data and verifying dashboard renders charts correctly with accurate calculations.

**Acceptance Scenarios**:

1. **Given** admin accesses `/admin/analytics`, **When** page loads, **Then** dashboard displays 7-day usage trends for tokens, conversations, and feature breakdown
2. **Given** metrics exist in Redis, **When** dashboard calculates totals, **Then** all aggregates are computed correctly (no user-specific data exposed)
3. **Given** no metrics exist yet (new deployment), **When** dashboard loads, **Then** it shows "No data yet" state with clear messaging

---

### User Story 2 - Track LLM Token Usage and Cost (Priority: P1)

The system tracks all Gemini 2.5 Flash preview token usage (input + output) in the `/api/hockey-chat` endpoint. After each AI response completes, the system increments daily/weekly/monthly counters in Redis with token counts and estimated costs.

**Why this priority**: Token usage is the best proxy for real engagement without identifying users. Cost tracking is essential for financial sustainability.

**Independent Test**: Can be tested by making AI chat requests and verifying Redis counters increment correctly with accurate token counts.

**Acceptance Scenarios**:

1. **Given** user sends chat message, **When** AI response completes, **Then** system increments daily token counter (input + output tokens)
2. **Given** token usage recorded, **When** cost calculation runs, **Then** system multiplies tokens by Gemini pricing ($0.075 per 1M input, $0.30 per 1M output)
3. **Given** multiple conversations throughout day, **When** end of day aggregation runs, **Then** daily totals roll up to weekly and monthly counters

---

### User Story 3 - Track Feature Usage Patterns (Priority: P1)

The system tracks MCP tool invocations (schedule queries, player stats, team stats, travel time calculations) and venue resolution calls. Each tool invocation increments a feature-specific counter in Redis, enabling feature adoption analysis.

**Why this priority**: Understanding which features are used helps prioritize development and identify underutilized features that may need UX improvements.

**Independent Test**: Can be tested by triggering each MCP tool and verifying corresponding Redis counter increments.

**Acceptance Scenarios**:

1. **Given** user asks schedule question, **When** `get_schedule` tool executes, **Then** system increments schedule query counter
2. **Given** user asks travel time question, **When** `calculate_travel_times` tool executes, **Then** system increments travel calculation counter and Google Routes API call counter
3. **Given** user asks stats question, **When** `get_player_stats` or `get_team_stats` executes, **Then** system increments appropriate stats counter
4. **Given** agent resolves venue address, **When** venue resolution API called, **Then** system increments venue lookup counter

---

### User Story 4 - Track Performance and Reliability Metrics (Priority: P2)

The system tracks API response times (P95/P99), error rates per endpoint, MCP timeout rates, and uptime percentage. Performance degradation triggers alerts (future enhancement: automated monitoring).

**Why this priority**: Performance and reliability are critical for user experience. Tracking these metrics enables proactive infrastructure improvements.

**Independent Test**: Can be tested by simulating slow responses, errors, and timeouts, then verifying metrics are recorded accurately.

**Acceptance Scenarios**:

1. **Given** API request completes, **When** response time recorded, **Then** system updates rolling P95/P99 calculations for that endpoint
2. **Given** API request fails, **When** error occurs, **Then** system increments error counter for that endpoint and records error type
3. **Given** MCP tool times out, **When** timeout detected, **Then** system increments MCP timeout counter and logs timeout details (no user context)
4. **Given** 24-hour period completes, **When** uptime calculation runs, **Then** system calculates uptime percentage from successful vs failed requests

---

### User Story 5 - View Historical Trends and Cost Projections (Priority: P2)

The dashboard displays weekly/monthly trend charts for token usage, feature adoption, and performance metrics. An automated cost projection estimates monthly API costs based on current usage trends, with alerts when approaching budget thresholds.

**Why this priority**: Trend analysis enables data-driven decisions about scaling, feature prioritization, and financial sustainability.

**Independent Test**: Can be tested by seeding Redis with multi-week data and verifying trend charts render correctly with accurate projections.

**Acceptance Scenarios**:

1. **Given** multiple weeks of data exist, **When** trend chart renders, **Then** it shows usage growth/decline patterns with percentage change indicators
2. **Given** current token usage rate, **When** cost projection runs, **Then** system estimates monthly cost based on 30-day average
3. **Given** projected monthly cost exceeds budget threshold, **When** projection calculated, **Then** system displays warning indicator on dashboard
4. **Given** historical data, **When** comparing periods, **Then** dashboard highlights significant changes (e.g., "↑35% vs last week")

---

### Edge Cases

- What happens when Redis is temporarily unavailable (metrics collection should fail gracefully, not block user requests)?
- How does system handle clock skew across Vercel serverless function instances (use UTC timestamps consistently)?
- What happens when Redis free tier limit is reached (need monitoring and alerting)?
- How does system handle metrics for failed requests (should still track errors even if request didn't complete)?
- What happens when multiple requests complete simultaneously (Redis atomic increments prevent race conditions)?
- How does dashboard handle missing data for specific time periods (show gaps clearly, don't interpolate)?
- What happens when admin dashboard is accessed by non-admin users (implement simple authentication or environment-based access control)?

## Requirements

### Functional Requirements

- **FR-001**: System MUST store aggregate metrics in Upstash Redis with no user identifiers (session IDs, IPs, device fingerprints)
- **FR-002**: System MUST track Gemini 2.5 Flash preview token usage (input + output) for every AI chat completion
- **FR-003**: System MUST calculate estimated cost per request using Gemini pricing ($0.075 per 1M input, $0.30 per 1M output)
- **FR-004**: System MUST track MCP tool invocations by tool type (schedule, stats, travel calculations)
- **FR-005**: System MUST track Google Routes API calls separately (cost tracking for travel time feature)
- **FR-006**: System MUST track venue resolution API calls with success/failure counts
- **FR-007**: System MUST record API response times (P95/P99) for performance monitoring
- **FR-008**: System MUST track error rates by endpoint and error type
- **FR-009**: System MUST calculate daily/weekly/monthly aggregates with automatic rollup
- **FR-010**: System MUST estimate conversation count from token patterns (e.g., avg 150 tokens/conversation)
- **FR-011**: Dashboard MUST display 7-day and 30-day trends for all key metrics
- **FR-012**: Dashboard MUST calculate and display projected monthly costs based on current usage
- **FR-013**: Dashboard MUST show feature usage breakdown (percentage of total activity)
- **FR-014**: Dashboard MUST display performance metrics (P95 response time, uptime percentage)
- **FR-015**: System MUST NOT log query content, user preferences, or any PII
- **FR-016**: Metrics collection MUST fail gracefully if Redis unavailable (don't block user requests)
- **FR-017**: All timestamps MUST use UTC for consistent aggregation across serverless instances
- **FR-018**: Dashboard access MUST be restricted (environment variable or simple auth check)
- **FR-019**: System MUST support page load tracking (/hockey, /about, /privacy page views)
- **FR-020**: System MUST track cache hit/miss rates for performance optimization insights

### Non-Functional Requirements

- **NFR-001**: Metrics collection MUST add <10ms overhead to API requests (P95)
- **NFR-002**: Dashboard page load MUST complete in under 2 seconds (P95)
- **NFR-003**: Redis operations MUST use atomic increments to prevent race conditions
- **NFR-004**: System MUST handle 1000+ requests/day within Upstash free tier (25,000 commands/day)
- **NFR-005**: Dashboard MUST be responsive (mobile-friendly for quick checks)
- **NFR-006**: Metrics data retention MUST be at least 90 days (Redis TTL management)
- **NFR-007**: Cost calculations MUST be accurate to within 5% of actual API billing

### Privacy Requirements

- **PR-001**: System MUST NOT store any user-identifiable information (session IDs, IPs, fingerprints)
- **PR-002**: System MUST NOT correlate events to individual users across sessions
- **PR-003**: System MUST NOT store query content or user input text
- **PR-004**: System MUST store only aggregate counters (no event-level granularity with timestamps per user)
- **PR-005**: Dashboard MUST be transparent about what's tracked (could be made public to demonstrate privacy compliance)

### Key Entities

- **MetricCounter**: Represents an aggregate count for a specific metric (e.g., daily token count, schedule query count). Attributes include metric key (unique identifier), count value, time period (day/week/month), and timestamp.

- **CostEstimate**: Represents estimated API cost for a time period. Attributes include token counts (input/output), pricing rates, total estimated cost, and time period.

- **PerformanceMetric**: Represents performance measurement for an API endpoint. Attributes include endpoint name, response times (P95/P99), error count, success count, and uptime percentage.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dashboard provides visibility into daily active usage within 24 hours of deployment
- **SC-002**: Token cost tracking is accurate to within 5% of actual Gemini API billing
- **SC-003**: Metrics collection adds <10ms overhead to API requests (95th percentile)
- **SC-004**: Admin can access dashboard and understand usage trends within 30 seconds
- **SC-005**: System successfully tracks at least 100 conversations/day without Redis quota issues
- **SC-006**: Feature adoption percentages sum to 100% (accurate breakdown)
- **SC-007**: Performance metrics detect and display degradation within 1 hour
- **SC-008**: Dashboard remains functional even if Redis is temporarily unavailable (shows cached/stale data)
- **SC-009**: Zero instances of PII leakage in metrics data (verified by privacy audit)
- **SC-010**: Cost projections enable informed decisions about scaling and feature prioritization

## Assumptions

- Upstash Redis free tier (25,000 commands/day) is sufficient for initial launch (100-500 users/day)
- Gemini 2.5 Flash preview pricing remains stable ($0.075/$0.30 per 1M tokens)
- Admin dashboard doesn't need sophisticated authentication (environment variable check acceptable for MVP)
- Estimated conversation count from token patterns (avg ~150 tokens/conversation) is acceptable approximation
- Dashboard doesn't need real-time updates (30-second refresh interval is acceptable)
- Redis atomic increments handle concurrency without additional locking mechanisms
- 90-day metric retention is sufficient for trend analysis (don't need years of history yet)
- Dashboard can be read-only (no data export or advanced filtering for MVP)
- Simple bar/line charts are sufficient (no need for complex visualizations yet)

## Dependencies

- Upstash Redis account with free tier database provisioned
- Gemini API token usage metadata from AI SDK 5 streaming responses
- Environment variable for Upstash Redis URL and token
- Next.js 15 App Router for dashboard page and API routes
- Chart library (e.g., Recharts) for dashboard visualizations

## Out of Scope

- User segmentation or cohort analysis (would violate privacy principles)
- Funnel analysis or user journey tracking (no individual correlation)
- Third-party analytics services (Google Analytics, Mixpanel, Plausible)
- Real-time alerting or monitoring (use simple dashboard checks for MVP)
- Data export to CSV or external systems (read-only dashboard only)
- Advanced filtering or date range selection (fixed 7-day and 30-day views)
- Unique user estimation via HyperLogLog or similar (explicitly out of scope per privacy policy)
- A/B testing infrastructure (defer to post-MVP)
- Automated cost alerts via email/Slack (manual dashboard checks acceptable for MVP)
- Multi-region or multi-environment metrics aggregation (single production instance only)

## Privacy Compliance Statement

This feature is designed with "privacy-first" as a core principle, not a constraint. All metrics track **events, not people**. We count transactions like a physical store counting purchases without identifying shoppers.

**What We Track**:
- Total token usage (aggregate count)
- API call counts by feature type
- Response times and error rates (no request IDs)
- Page load counts (no IP addresses or fingerprints)

**What We DON'T Track**:
- ❌ User identifiers (no session IDs, cookies, IPs)
- ❌ Query content or user input
- ❌ Individual user behavior or journeys
- ❌ Device fingerprints or user agents
- ❌ Correlated events across sessions

This approach could be fully transparent - we could make the dashboard public to demonstrate our privacy commitment.
