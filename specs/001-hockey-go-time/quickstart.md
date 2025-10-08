# Quickstart Guide - Hockey Go Time Implementation

**Feature**: 001-hockey-go-time | **Date**: 2025-10-07 | **Plan**: [plan.md](./plan.md)

This guide provides a step-by-step implementation path prioritized for the 2.5-week Capstone timeline.

---

## Implementation Phases

### Phase 1 (P1) - Foundation (Week 1)
**Goal**: User preferences, in-memory caching, routing fix

**Priority**: MUST HAVE for Capstone demo

1. **Fix Routing** (`app/hockey/` → `/`)
   - Move `app/hockey/page.tsx` to `app/page.tsx`
   - Move `app/hockey/layout.tsx` to `app/layout.tsx`
   - Update navigation links and redirects
   - Test: Verify app loads at `https://hockeygotime.vercel.app/` (not `/hockey`)

2. **Implement User Preferences** (localStorage)
   - Create `types/preferences.ts` (UserPreferences interface)
   - Create `lib/storage/preferences.ts` (localStorage wrapper)
   - Create `components/ui/preferences/PreferencePanel.tsx` (Client Component)
   - Add preference panel to main layout (sidebar or collapsible)
   - Update system prompt to use saved preferences
   - Test: Set preferences, refresh browser, verify persistence

3. **Implement In-Memory Cache**
   - Create `types/cache.ts` (CacheProvider interface, CacheEntry)
   - Create `lib/cache/memory-cache.ts` (MemoryCacheProvider)
   - Create `lib/cache/index.ts` (singleton exports)
   - Integrate cache in `app/api/hockey-chat/route.ts`
   - Test: Query schedule twice, verify second query is faster

4. **Verification**
   - Run `pnpm tsc --noEmit` (zero errors)
   - Test preferences persistence across sessions
   - Test cache hit/miss scenarios
   - Deploy to Vercel, test production

**Deliverable**: Working user preferences + fast cached queries

---

### Phase 2 (P2) - Travel Planning (Week 2)
**Goal**: Google Routes API integration, travel time calculations

**Priority**: HIGH demo value for Capstone

1. **Hardcode Venue Addresses**
   - Get venue list from user (14U B Jr. Kings (1) schedule)
   - Add venue mappings to `components/agent/hockey-prompt.ts`
   - Update system prompt with venue → address lookup instructions
   - Test: Verify AI can resolve venue names to addresses

2. **Implement Google Routes API Client**
   - Create `types/travel.ts` (RouteResponse, ComputeRoutesRequest, TravelCalculation)
   - Create `lib/travel/google-routes.ts` (computeRoute function)
   - Add `GOOGLE_MAPS_API_KEY` to `.env.local` and Vercel
   - Test: Call API directly with sample addresses

3. **Implement Travel Time Calculator**
   - Create `lib/travel/time-calculator.ts`
   - Function: `calculateTravelTimes(game, userPrefs, venueAddress)`
   - Returns: `{ wakeUpTime, departureTime, arrivalTime, travelDuration }`
   - Test: Verify calculations with known examples

4. **Integrate with AI Chat**
   - Update system prompt with travel calculation instructions
   - Add travel time tool (optional: custom AI SDK tool) or let AI orchestrate
   - Update chat to handle travel-related queries
   - Test queries:
     - "When do I need to leave for Sunday's game?"
     - "What time should I wake up for the October 5th game?"

5. **Verification**
   - Run `pnpm tsc --noEmit` (zero errors)
   - Test travel calculations with real games
   - Verify traffic-aware routing (compare morning vs. afternoon)
   - Deploy to Vercel, test production

**Deliverable**: Working travel time calculations with real traffic data

---

### Phase 3 (P2 cont.) - Stats & Supabase Cache (Week 2-3)
**Goal**: Player/team stats, persistent caching

**Priority**: MEDIUM-HIGH demo value

1. **Verify SCAHA MCP Stats Tools**
   - Check SCAHA MCP server for `get_team_stats` and `get_player_stats` tools
   - If missing: coordinate with user to add tools to SCAHA MCP
   - Document actual response schemas in `contracts/scaha-mcp-tools.md`

2. **Implement Stats Types**
   - Create `types/stats.ts` (PlayerStats, TeamStats)
   - Create cache instances in `lib/cache/index.ts`
   - Test: Verify types match actual MCP tool responses

3. **Integrate Stats in AI Chat**
   - Update system prompt with stats query handling
   - Test queries:
     - "Show me Johnny's stats"
     - "How is our team doing?"
     - "Generate an end-of-season summary for my player"

4. **Implement Supabase Cache** (if time permits)
   - Create Supabase project
   - Run schema migrations (cache tables)
   - Create `lib/cache/supabase-cache.ts`
   - Create `lib/cache/factory.ts` (provider switching)
   - Add environment variables to Vercel
   - Switch `CACHE_PROVIDER=supabase` in production
   - Test: Verify cache persists across cold starts

5. **Verification**
   - Run `pnpm tsc --noEmit` (zero errors)
   - Test stats queries with real players/teams
   - Test Supabase cache persistence
   - Deploy to Vercel, test production

**Deliverable**: Stats queries working + persistent caching (if time permits)

---

### Phase 4 (P3-P5) - Polish & Post-Capstone
**Goal**: Enhanced features, monetization, PGHL support

**Priority**: Defer if Capstone deadline approaching

1. **Enhanced Team/Venue Info** (P4)
   - Rink photos, team logos, venue maps
   - Deferred to post-Capstone

2. **Multi-League Support (PGHL)** (P4)
   - Additional MCP server integration
   - User preference for league selection
   - Deferred to post-Capstone

3. **Community Features** (P5)
   - About page
   - Donate/Support button (Venmo/PayPal)
   - Feedback form
   - If time permits before Capstone (low priority)

4. **Hotel Recommendations** (P2, deferred)
   - Implement post-Capstone
   - Low demo appeal (only 1 game requires hotel for test team)

5. **Venue Address Pipeline** (P3, post-Capstone)
   - LLM-based deduplication
   - Address search with confidence scoring
   - Human-in-the-loop verification
   - RAG storage and retrieval

---

## Development Workflow

### Daily Checklist
1. ✅ Run `pnpm tsc --noEmit` before committing
2. ✅ Test locally with `pnpm dev`
3. ✅ Verify MCP client lifecycle (no "closed client" errors)
4. ✅ Push to main branch for automatic Vercel deployment
5. ✅ Test production deployment

### Pre-Deployment Checklist
1. ✅ All TypeScript errors resolved
2. ✅ Environment variables set in Vercel dashboard
3. ✅ Test against production MCP server (https://scaha-mcp.vercel.app/api/mcp)
4. ✅ Verify GPT-5-mini 'low' setting performance
5. ✅ Manual smoke test in production

---

## File Creation Order

### Phase 1 (P1)
```
1. types/preferences.ts
2. lib/storage/preferences.ts
3. components/ui/preferences/PreferencePanel.tsx
4. types/cache.ts
5. lib/cache/memory-cache.ts
6. lib/cache/index.ts
7. app/api/hockey-chat/route.ts (update to use cache)
8. Move app/hockey/* → app/* (routing fix)
```

### Phase 2 (P2)
```
1. types/travel.ts
2. lib/travel/google-routes.ts
3. lib/travel/time-calculator.ts
4. components/agent/hockey-prompt.ts (add venue mappings)
5. app/api/hockey-chat/route.ts (integrate travel calculations)
```

### Phase 3 (P2 cont.)
```
1. types/stats.ts
2. lib/cache/index.ts (add stats cache instances)
3. app/api/hockey-chat/route.ts (stats integration)
4. lib/cache/supabase-cache.ts (if time permits)
5. lib/cache/factory.ts (if Supabase implemented)
```

---

## Testing Strategy

### Manual Testing (Primary)
- **Preference Persistence**: Set prefs, refresh, verify
- **Cache Performance**: Query twice, verify second is faster
- **Travel Calculations**: Test with real games, verify times
- **Stats Queries**: Test with real players/teams
- **Production Deployment**: Smoke test after each push

### Automated Testing (Optional, if time permits)
- Unit tests for cache providers (`memory-cache.test.ts`, `supabase-cache.test.ts`)
- Integration tests for Google Routes API (`google-routes.test.ts`)
- E2E tests for critical user flows (Playwright)

**Capstone Priority**: Manual testing sufficient—focus on feature completion over test coverage.

---

## Environment Setup

### Required Environment Variables

**Local Development** (`.env.local`):
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# SCAHA MCP Server
SCAHA_MCP_URL=https://scaha-mcp.vercel.app/api/mcp

# Google Maps Routes API v2
GOOGLE_MAPS_API_KEY=...

# Supabase (Phase 3, if implemented)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Cache Provider (memory or supabase)
CACHE_PROVIDER=memory
```

**Vercel Production**:
- Set all variables in Vercel dashboard
- Ensure `SCAHA_MCP_URL` points to production MCP server
- Switch `CACHE_PROVIDER=supabase` when Phase 3 complete

---

## Debugging Guide

### Common Issues

**Issue 1: MCP "closed client" error**
- **Cause**: Client disconnected before streaming finished
- **Fix**: Move `client.disconnect()` to `onFinish` callback

**Issue 2: Preferences not persisting**
- **Cause**: localStorage only works in Client Components
- **Fix**: Ensure `PreferencePanel` has `'use client'` directive

**Issue 3: Cache always misses**
- **Cause**: Cache key mismatch or TTL expired
- **Fix**: Log cache keys, verify consistency

**Issue 4: Google Routes API 400 error**
- **Cause**: Invalid address format
- **Fix**: Verify venue mapping, check address geocodability

**Issue 5: TypeScript errors**
- **Cause**: Type mismatch, missing types
- **Fix**: Run `pnpm tsc --noEmit`, resolve errors before proceeding

---

## Demo Script (Capstone Presentation)

### Setup
1. Open https://hockeygotime.vercel.app/
2. Set preferences:
   - Team: Jr. Kings (1)
   - Division: 14U B
   - Home Address: [your address]
   - Prep Time: 30 minutes
   - Arrival Buffer: 30 minutes

### Demo Flow

**1. Basic Schedule Query**
- Query: "When do we play next?"
- Expected: AI returns next game with date, time, venue

**2. Travel Planning (Primary Demo)**
- Query: "When do I need to leave for Sunday's game?"
- Expected: AI calculates departure time based on traffic
- Query: "What time should I wake up for the October 5th game?"
- Expected: AI calculates wake-up time (game time - arrival - travel - prep)

**3. Stats Query (if implemented)**
- Query: "How is our team doing?"
- Expected: AI returns wins/losses/points/standing

**4. Cache Performance (subtle demo)**
- Query: "When do we play next?" (again)
- Expected: Near-instant response (cached)

### Key Talking Points
- **Agentic AI**: System orchestrates multiple tools (SCAHA MCP, Google Routes API)
- **MCP Integration**: StreamableHTTP to remote MCP server on Vercel
- **Traffic-Aware**: Uses Google Routes API v2 with arrivalTime for real traffic prediction
- **User-Centric**: Natural language, remembers preferences, conversational UX
- **Performance**: <3s queries, aggressive caching, fast responses

---

## Risk Mitigation

### Risk 1: SCAHA MCP Stats Tools Missing
- **Mitigation**: Deprioritize stats (P3), focus on travel planning (P2)
- **Fallback**: Demo schedule queries + travel only

### Risk 2: Google Routes API Quota Exceeded
- **Mitigation**: Aggressive caching (6-hour TTL for routes)
- **Fallback**: Use distance-based estimates with disclaimer

### Risk 3: Capstone Deadline Pressure
- **Mitigation**: Strict prioritization (P1 → P2 → P3), no gold plating
- **Fallback**: Ship minimal viable demo (prefs + travel), defer polish

### Risk 4: Venue Mapping Manual Effort
- **Mitigation**: Limit to ~10-15 venues (only demo team's games)
- **Fallback**: Hardcode only most common venues, skip edge cases

---

## Next Steps (Immediate)

1. **Obtain Venue List**: User to provide 14U B Jr. Kings (1) venue names and addresses
2. **Verify SCAHA MCP Stats Tools**: Check if `get_team_stats` and `get_player_stats` exist
3. **Start Phase 1 Implementation**: Begin with preferences and in-memory cache
4. **Create Git Branch**: `git checkout -b 001-hockey-go-time`

---

## Success Criteria

**Phase 1 Complete**:
- ✅ App loads at root path (not `/hockey`)
- ✅ User preferences persist across sessions
- ✅ Cached queries respond in <1s
- ✅ Zero TypeScript errors

**Phase 2 Complete**:
- ✅ Travel time queries work with real traffic data
- ✅ Departure and wake-up times calculated correctly
- ✅ Venue addresses resolved via hardcoded mappings
- ✅ Production deployment functional

**Capstone Demo Ready**:
- ✅ All P1 and P2 features working
- ✅ Demo script tested and rehearsed
- ✅ Production deployment stable
- ✅ Constitution compliance verified

**Post-Capstone Goals** (optional):
- ⬜ Stats queries implemented
- ⬜ Supabase cache deployed
- ⬜ Donation button added
- ⬜ Venue address pipeline (LLM-based)
