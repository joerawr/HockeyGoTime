# Implementation Tasks: Hockey Go Time - Travel Planning and Stats Enhancement

**Feature**: 001-hockey-go-time | **Date**: 2025-10-07
**Branch**: `001-hockey-go-time` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

This task list organizes implementation by **user story** to enable independent development and testing. Each phase represents a complete, testable user story. Tasks within stories marked **[P]** can be executed in parallel.

**Total Tasks**: 47
**Capstone Timeline**: 2.5 weeks (deadline ~2025-10-25)
**Priority**: P1 (User Stories 1, 5) → P2 (User Stories 2, 4, 5) → P3+ (deferred post-Capstone)

---

## Phase 1: Setup & Configuration

**Goal**: Initialize project infrastructure and dependencies needed by all user stories

**Completion Criteria**:
- ✅ TypeScript strict mode enabled
- ✅ All dependencies installed
- ✅ Environment variables documented
- ✅ Development environment functional

### Tasks

**T001** [X] [P] Install timezone handling dependencies
- **File**: `package.json`
- **Action**: Run `pnpm add date-fns date-fns-tz`
- **Validation**: ✅ Packages installed (date-fns@4.1.0, date-fns-tz@3.2.0)

**T002** [X] [P] Create environment variable template
- **File**: `.env.local.template`
- **Action**: Document required variables:
  ```
  OPENAI_API_KEY=sk-...
  SCAHA_MCP_URL=https://scaha-mcp.vercel.app/api/mcp
  GOOGLE_MAPS_API_KEY=...
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...
  CACHE_PROVIDER=memory
  ```
- **Validation**: ✅ Template updated with all required variables

**T003** [X] Update TypeScript configuration (if needed)
- **File**: `tsconfig.json`
- **Action**: Verify `strict: true` is enabled
- **Validation**: ✅ TypeScript strict mode enabled, type checking passes

---

## Phase 2: Foundational Infrastructure

**Goal**: Build core abstractions required by all user stories (type system, cache interface, timezone utilities)

**Completion Criteria**:
- ✅ All core types defined
- ✅ Cache provider interface created
- ✅ Timezone utility functions working
- ✅ Type checking passes

### Tasks

**T004** [X] [P] Create user preferences types
- **File**: `types/preferences.ts`
- **Action**: Define `UserPreferences` interface
- **Validation**: ✅ Type created with defaults, autocomplete working

**T005** [X] [P] Create schedule/game types
- **File**: `types/schedule.ts`
- **Action**: Define `Game` and `ScheduleData` interfaces per data-model.md
- **Validation**: ✅ Types created, no TypeScript errors

**T006** [X] [P] Create travel calculation types
- **File**: `types/travel.ts`
- **Action**: Define `TravelCalculation`, `RouteResponse`, `ComputeRoutesRequest` interfaces
- **Validation**: ✅ Types created, no TypeScript errors

**T007** [X] [P] Create stats types
- **File**: `types/stats.ts`
- **Action**: Define `PlayerStats`, `TeamStats` interfaces
- **Validation**: ✅ Types created, no TypeScript errors

**T008** [X] [P] Create cache types
- **File**: `types/cache.ts`
- **Action**: Define `CacheProvider<T>` interface and `CacheEntry<T>` type
- **Validation**: ✅ Interface created, no TypeScript errors

**T009** [X] [P] Create timezone utility functions
- **File**: `lib/utils/timezone.ts`
- **Action**: Implement timezone conversion and formatting functions
- **Dependencies**: date-fns, date-fns-tz (T001)
- **Validation**: ✅ All functions implemented with DST awareness

**T010** [X] Create validation utilities
- **File**: `lib/utils/validation.ts`
- **Action**: Implement validation and normalization functions
- **Validation**: ✅ All utility functions implemented

---

## Phase 3: User Story 1 - User Preferences (P1)

**Story**: Parents save their preferences (team, home address, prep time, arrival buffer) for personalized queries

**Independent Test Criteria**:
- ✅ New user prompted for preferences on first visit
- ✅ Preferences persist across browser sessions
- ✅ Preferences displayed in UI panels
- ✅ User can update preferences and changes are saved
- ✅ Different browsers maintain independent preferences

### Tasks

**T011** [X] [US1] Create localStorage wrapper
- **File**: `lib/storage/preferences.ts` ✅
- **Action**: Implement `PreferencesStore`:
  - `get(): UserPreferences | null` - Read from localStorage ✅
  - `set(prefs: UserPreferences): void` - Write to localStorage ✅
  - `clear(): void` - Remove from localStorage ✅
  - Handle `typeof window === 'undefined'` for SSR ✅
- **Dependencies**: T004 (UserPreferences type)
- **Validation**: ✅ Test in browser console: set, refresh, verify persistence

**T012** [X] [US1] Create preference input form component
- **File**: `components/ui/preferences/PreferenceForm.tsx` ✅
- **Action**: Create Client Component with form fields:
  - Team (text input) ✅
  - Division (text input) ✅
  - Season (text input, default "2025/2026") ✅
  - Home Address (text input) ✅
  - Prep Time (number input, default 30) ✅
  - Arrival Buffer (number input, default 60) ✅
  - Save button ✅
- **Dependencies**: T004, T011
- **Validation**: ✅ Form renders, accepts input, validation errors display

**T013** [X] [US1] Create preference display panel component
- **File**: `components/ui/preferences/PreferencePanel.tsx` ✅
- **Action**: Create Client Component that:
  - Loads preferences from localStorage on mount ✅
  - Displays current preferences (read-only or editable) ✅
  - Provides "Edit" button to show PreferenceForm ✅
  - Syncs with localStorage changes ✅
- **Dependencies**: T011, T012
- **Validation**: ✅ Panel displays saved preferences correctly

**T014** [X] [US1] [P] Integrate preference panel into layout
- **File**: `app/page.tsx` ✅
- **Action**: Add PreferencePanel to sidebar or collapsible section ✅
- **Dependencies**: T013
- **Validation**: ✅ Panel appears in UI, accessible to users

**T015** [X] [US1] [P] Update system prompt for preference context
- **File**: `components/agent/hockey-prompt.ts` ✅
- **Action**: Add instructions for using saved preferences when user says "we", "our team" ✅
- **Dependencies**: None
- **Validation**: ✅ Review prompt, confirm preference handling documented

**T016** [X] [US1] [P] Update AI chat route to load user preferences
- **File**: `app/api/hockey-chat/route.ts` and `components/chat/chat-assistant.tsx`
- **Action**:
  - Accept preferences from client request body ✅
  - Pass preferences to AI system prompt context ✅
  - Use saved team/division when user queries mention "we" ✅
  - Custom transport in chat-assistant.tsx loads preferences from PreferencesStore ✅
- **Dependencies**: T004, T011
- **Validation**: Query with "we" resolves to saved team ✅

**🎯 CHECKPOINT**: User Story 1 Complete
- Test: New user → set preferences → refresh → preferences persist
- Test: Query "when do we play next?" → uses saved team
- Run: `pnpm tsc --noEmit` (zero errors)

---

## Phase 4: User Story 5 (Part 1) - In-Memory Cache (P1)

**Story**: Fast responses via in-memory caching (session-based)

**Independent Test Criteria**:
- ✅ First schedule query fetches from MCP (slower)
- ✅ Second schedule query returns cached data (<1s)
- ✅ Cache expires after session (cold start resets)
- ✅ Type checking passes

### Tasks

**T017** [X] [US5] Create in-memory cache provider
- **File**: `lib/cache/memory-cache.ts` ✅
- **Action**: Implement `MemoryCacheProvider<T>` class:
  - `get(key: string): Promise<T | null>` - Check TTL, return data or null ✅
  - `set(key: string, data: T, ttl?: number): Promise<void>` - Store with timestamp ✅
  - `delete(key: string): Promise<void>` ✅
  - `clear(): Promise<void>` ✅
  - `has(key: string): Promise<boolean>` ✅
  - Default TTL: 24 hours (86400000ms) ✅
  - Added bonus: `getStats()` for debugging ✅
- **Dependencies**: T008 (CacheProvider interface)
- **Validation**: Unit test get/set/expiration ✅

**T018** [X] [US5] Create cache singleton instances
- **File**: `lib/cache/index.ts` ✅
- **Action**: Export singleton instances:
  ```typescript
  export const scheduleCache = new MemoryCacheProvider<ScheduleData>();
  export const teamStatsCache = new MemoryCacheProvider<TeamStats>();
  export const playerStatsCache = new MemoryCacheProvider<PlayerStats>();
  ```
- Added cache key generators for consistency ✅
- **Dependencies**: T017, T005, T007
- **Validation**: Import in another file, verify singletons work ✅

**T019** [X] [US5] Integrate cache in AI chat route
- **File**: `app/api/hockey-chat/route.ts` ✅
- **Action**:
  - Before calling MCP `get_schedule`, check cache with key: `schedule:{season}:{division}:{team}` ✅
  - If cache hit: use cached data ✅
  - If cache miss: call MCP, store result in cache (24hr TTL) ✅
  - Log cache hits/misses and timing ✅
  - Same pattern for stats queries (ready for future implementation)
- **Dependencies**: T018
- **Validation**: Query twice, verify second query is faster (log timestamps) ✅

**🎯 CHECKPOINT**: User Story 5 (Part 1) Complete
- Test: Query schedule → MCP call → cache stored
- Test: Query again → cache hit → <1s response
- Run: `pnpm tsc --noEmit` (zero errors)

---

## Phase 5: Routing Fix (P1)

**Goal**: Move app from `/hockey` to root path `/` for cleaner demo URL

**Independent Test Criteria**:
- ✅ App accessible at `https://hockeygotime.vercel.app/`
- ✅ No redirect from `/hockey` (or redirects to `/`)
- ✅ All functionality works at root path

### Tasks

**T020** [X] [P1] Move hockey page to root
- **Files**: `app/hockey/page.tsx` → `app/page.tsx` ✅
- **Action**:
  - Move hockey page content to root page.tsx ✅
  - Update any relative imports ✅
  - Remove `app/hockey/` directory ✅
  - Clean Next.js cache ✅
- **Validation**: `pnpm tsc --noEmit` passes ✅

**T021** [X] [P1] Update API route references (if any)
- **Files**: Searched entire codebase for `/hockey` references ✅
- **Action**: No hardcoded route paths to update ✅
  - `/api/hockey-chat` is API endpoint (not a route) ✅
  - `hockey-prompt` is filename (not a route) ✅
- **Validation**: Search confirms no `/hockey` route references ✅

**T022** [X] [P1] Test and deploy routing fix
- **Action**:
  - Test locally: `http://localhost:3000/` works ✅
  - Deploy to Vercel ✅
  - Test production: `https://hockeygotime.vercel.app/` works ✅
- **Validation**: ✅ Production app loads at root path

**🎯 CHECKPOINT**: Routing Fix Complete
- Test: Visit `https://hockeygotime.vercel.app/` → app loads
- Run: `pnpm tsc --noEmit` (zero errors)

---

## Phase 6: User Story 2 - Travel Time Calculations (P2)

**Story**: Calculate wake-up and departure times based on traffic-aware travel time

**Independent Test Criteria**:
- ✅ User asks "when do I need to leave?" → system calculates departure time
- ✅ User asks "when should I wake up?" → system calculates wake-up time
- ✅ Travel time uses real-time traffic data (Google Routes API)
- ✅ Graceful degradation if API fails
- ✅ Times displayed in 12-hour AM/PM format

### Tasks

**T023** [US2] [P] Create Google Routes API client
- **File**: `lib/travel/google-routes.ts`
- **Action**: Implement `computeRoute(params)` function:
  - Input: `{ originAddress, destinationAddress, arrivalTime }`
  - Converts `arrivalTime` to UTC using timezone utilities (T009)
  - Makes POST request to `https://routes.googleapis.com/directions/v2:computeRoutes`
  - Uses `TRAFFIC_AWARE_OPTIMAL` routing preference
  - Parses response: `{ duration: string, distanceMeters: number }`
  - Returns travel time in seconds
  - Handles API errors gracefully
- **Dependencies**: T006, T009, T002 (GOOGLE_MAPS_API_KEY)
- **Validation**: Test with sample addresses, verify traffic data used

**T024** [US2] [P] Create travel time calculator
- **File**: `lib/travel/time-calculator.ts`
- **Action**: Implement `calculateTravelTimes(game, userPrefs, venueAddress)`:
  - Input: Game, UserPreferences, venue address string
  - Converts game time (California PT) to UTC for API call (T009)
  - Calls Google Routes API (T023)
  - Calculates:
    - `arrivalTime = gameTime - arrivalBufferMinutes`
    - `departureTime = arrivalTime - travelDurationSeconds`
    - `wakeUpTime = departureTime - prepTimeMinutes`
  - Converts all times back to California PT
  - Formats times in 12-hour AM/PM format (T009)
  - Returns `TravelCalculation` object
- **Dependencies**: T006, T009, T023
- **Validation**: Test with known game time and address, verify calculations

**T025** [X] [US2] Update venue address mappings
- **File**: `components/agent/hockey-prompt.ts` ✅
- **Action**: Venue mappings added (30 venues hardcoded) ✅
  - Expanded from 9 to 30 SCAHA venues
  - Added variant name handling (YLICE, Glacial Gardens, etc.)
  - Covers all major regions (North, South, East, West, Central)
- **Validation**: ✅ All mappings present in system prompt
- **Post-Capstone**: Migrate to LLM-based venue address deduplication pipeline (deferred to bottom of backlog)

**T026** [US2] Create AI SDK custom tool for travel calculations (optional)
- **File**: `lib/tools/travel-tool.ts` (optional approach)
- **Action**: Create custom AI SDK tool that wraps travel calculator:
  - Tool name: `calculate_travel_times`
  - Parameters: `gameId` (finds game from schedule)
  - Returns: `TravelCalculation` object
  - Alternative: Let AI orchestrate using system prompt instructions
- **Dependencies**: T024
- **Validation**: AI can call tool and format response

**T027** [US2] Update AI chat route for travel queries
- **File**: `app/api/hockey-chat/route.ts`
- **Action**:
  - If travel tool created (T026): Add to available tools
  - Otherwise: Update system prompt with travel calculation instructions
  - Provide venue address lookup from hardcoded mappings
  - Handle "when do I need to leave?" queries
  - Handle "when should I wake up?" queries
- **Dependencies**: T024, T025, T026 (optional)
- **Validation**: Test queries:
  - "When do I need to leave for Sunday's game at Yorba Linda ICE?"
  - "What time should I wake up for the October 5th game?"

**T028** [US2] Add travel time error handling
- **File**: `lib/travel/google-routes.ts`
- **Action**: Add fallback logic:
  - If Routes API fails → use distance-based estimate (straight-line distance × 1.3, 30mph avg speed)
  - Return disclaimer: "Estimated travel time (traffic data unavailable)"
  - Log errors for monitoring
- **Dependencies**: T023
- **Validation**: Simulate API failure, verify fallback works

**🎯 CHECKPOINT**: User Story 2 Complete
- Test: "When do I need to leave for Sunday's game?" → departure time calculated
- Test: "When should I wake up?" → wake-up time calculated
- Test: Times display in 12-hour AM/PM format ("7:00 AM" not "07:00")
- Run: `pnpm tsc --noEmit` (zero errors)
- Deploy: Vercel production, test with real queries

---

## Phase 7: User Story 4 - Player and Team Statistics (P2)

**Story**: View player/team stats and generate end-of-season summaries

**Independent Test Criteria**:
- ✅ Query "show me Johnny's stats" → displays goals, assists, points
- ✅ Query "how is our team doing?" → displays wins, losses, standing
- ✅ Stats cached for fast retrieval
- ✅ Stats queries work via SCAHA MCP tools

**Prerequisites**:
- ⚠️ SCAHA MCP server must have `get_team_stats` and `get_player_stats` tools
- ⚠️ Coordinate with user to verify/implement tools in SCAHA MCP

### Tasks

**T029** [US4] Verify SCAHA MCP stats tools availability
- **Action**:
  - Check SCAHA MCP server repository for `get_team_stats` and `get_player_stats`
  - If missing: coordinate with user to add tools
  - Document actual response schemas in `contracts/scaha-mcp-tools.md`
- **Validation**: Confirm tools exist and return expected data structure

**T030** [US4] Update stats types (if needed)
- **File**: `types/stats.ts`
- **Action**: Verify types match actual SCAHA MCP response format (from T029)
- **Dependencies**: T007, T029
- **Validation**: Import actual MCP response, verify type compatibility

**T031** [US4] Add stats cache instances (already in T018)
- **File**: `lib/cache/index.ts`
- **Action**: Verify `statsCache` singleton exists (created in T018)
- **Dependencies**: T018, T030
- **Validation**: Import statsCache, verify TypeScript autocomplete

**T032** [US4] Update AI chat route for stats queries
- **File**: `app/api/hockey-chat/route.ts`
- **Action**:
  - SCAHA MCP client already auto-discovers tools via `client.tools()`
  - Before displaying stats, check cache: `stats:team:{season}:{division}:{team}` or `stats:player:{season}:{division}:{team}:{player}`
  - If cache hit: use cached data
  - If cache miss: MCP tool call, cache result (24hr TTL)
- **Dependencies**: T029, T031
- **Validation**: Test queries:
  - "Show me Johnny Smith's stats"
  - "How is our team doing?"
  - "Generate an end-of-season summary for Johnny"

**T033** [US4] Update system prompt for stats guidance
- **File**: `components/agent/hockey-prompt.ts`
- **Action**: Add instructions for:
  - When to call `get_team_stats` vs `get_player_stats`
  - How to format stat displays (table-like layout)
  - How to generate end-of-season summaries (narrative style)
- **Dependencies**: T029
- **Validation**: Review prompt, confirm stats handling documented

**🎯 CHECKPOINT**: User Story 4 Complete
- Test: "Show me stats for player X" → displays stats
- Test: "How is team Y doing?" → displays team record
- Test: Stats queries cached and fast on repeat
- Run: `pnpm tsc --noEmit` (zero errors)

---

## Phase 8: User Story 5 (Part 2) - Supabase Persistent Cache (P2)

**Story**: Upgrade from in-memory to Supabase persistent cache

**Independent Test Criteria**:
- ✅ Cache survives cold starts (Vercel serverless function restarts)
- ✅ Cache shared across multiple serverless instances
- ✅ 24-hour TTL enforced
- ✅ Can switch providers via `CACHE_PROVIDER` env var

### Tasks

**T034** [US5] Create Supabase project and schema
- **Action**:
  - Create Supabase project at supabase.com
  - Run SQL migrations to create cache tables:
    ```sql
    CREATE TABLE cache_schedule (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ttl_seconds INTEGER DEFAULT 86400
    );
    CREATE INDEX idx_cache_schedule_updated_at ON cache_schedule(updated_at);
    -- Repeat for cache_team_stats, cache_player_stats
    ```
  - Copy Supabase URL and service role key to `.env.local`
- **Validation**: Tables exist in Supabase dashboard

**T035** [US5] Install Supabase client library
- **File**: `package.json`
- **Action**: Run `pnpm add @supabase/supabase-js`
- **Validation**: Package appears in dependencies

**T036** [US5] Create Supabase cache provider
- **File**: `lib/cache/supabase-cache.ts`
- **Action**: Implement `SupabaseCacheProvider<T>` class:
  - Constructor accepts `tableName` parameter
  - Initializes Supabase client with env vars
  - Implements same `CacheProvider<T>` interface as memory cache
  - `get()`: Query Supabase, check TTL, return data or null
  - `set()`: Upsert row with key, data, updated_at, ttl_seconds
  - `delete()`, `clear()`, `has()` methods
- **Dependencies**: T008, T034, T035
- **Validation**: Test CRUD operations against Supabase

**T037** [US5] Create cache provider factory
- **File**: `lib/cache/factory.ts`
- **Action**: Implement `createCacheProvider<T>(type)`:
  - Reads `CACHE_PROVIDER` env var
  - If "supabase": returns `SupabaseCacheProvider`
  - If "memory" or undefined: returns `MemoryCacheProvider`
  - Table name mapping: schedule → cache_schedule, team-stats → cache_team_stats, etc.
- **Dependencies**: T017, T036
- **Validation**: Toggle env var, verify correct provider instantiated

**T038** [US5] Update cache singleton exports
- **File**: `lib/cache/index.ts`
- **Action**: Replace hardcoded `MemoryCacheProvider` with factory:
  ```typescript
  export const scheduleCache = createCacheProvider<ScheduleData>('schedule');
  export const teamStatsCache = createCacheProvider<TeamStats>('team-stats');
  export const playerStatsCache = createCacheProvider<PlayerStats>('player-stats');
  ```
- **Dependencies**: T037
- **Validation**: Import caches, verify type safety

**T039** [US5] Test Supabase cache in development
- **Action**:
  - Set `CACHE_PROVIDER=supabase` in `.env.local`
  - Run queries, verify data stored in Supabase tables
  - Test TTL expiration (manually update `updated_at` to past)
  - Test cache hit/miss scenarios
- **Dependencies**: T038
- **Validation**: Supabase dashboard shows cached data

**T040** [US5] Deploy Supabase cache to production
- **Action**:
  - Add Supabase env vars to Vercel dashboard:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `CACHE_PROVIDER=supabase`
  - Deploy to Vercel
  - Test production caching
- **Dependencies**: T039
- **Validation**: Production queries use Supabase cache

**🎯 CHECKPOINT**: User Story 5 (Part 2) Complete
- Test: Query schedule → cached in Supabase → survives cold start
- Test: Multiple serverless instances share cache
- Run: `pnpm tsc --noEmit` (zero errors)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Goal**: Final refinements, deployment verification, documentation

**Completion Criteria**:
- ✅ All type checking passes
- ✅ Production deployment stable
- ✅ Demo script tested
- ✅ Constitution compliance verified

### Tasks

**T041** [P] Create demo test script
- **File**: `specs/001-hockey-go-time/demo-script.md`
- **Action**: Document test scenarios for Capstone demo:
  - Set preferences flow
  - Schedule query: "When do we play next?"
  - Travel query: "When do I need to leave for Sunday's game?"
  - Stats query: "How is our team doing?" (if implemented)
  - Cache performance demonstration
- **Validation**: Practice demo, time each scenario

**T042** [P] Update README.md with new features
- **File**: `README.md`
- **Action**: Document:
  - User preferences feature
  - Travel time calculations
  - Caching strategy
  - Stats queries (if implemented)
  - Environment variable requirements
- **Validation**: README accurately reflects implemented features

**T043** [P] Verify constitution compliance
- **Action**: Review `.specify/memory/constitution.md` v2.1.0:
  - ✅ 12-hour AM/PM time format used
  - ✅ Timezone conversions (PST/PDT → UTC) implemented
  - ✅ Type checking passes
  - ✅ Performance targets met (<1s cached, <3s uncached)
  - ✅ MCP lifecycle correct (close in `onFinish`)
  - ✅ pnpm exclusively used
- **Validation**: All principles satisfied

**T044** [P] Performance testing and optimization
- **Action**:
  - Measure response times for cached vs uncached queries
  - Verify <1s for cache hits
  - Verify <3s for cache misses (95th percentile)
  - Optimize slow paths if needed
- **Validation**: Performance targets met

**T045** [P] Production smoke testing
- **Action**: Test in production:
  - Set preferences → persist across sessions
  - Schedule query → fast response
  - Travel query → correct calculations
  - Stats query → displays data (if implemented)
  - Cache behavior → survives cold starts (Supabase)
- **Validation**: All features work in production

**T046** Final type checking and deployment
- **Action**:
  - Run `pnpm tsc --noEmit` - ensure zero errors
  - Fix any remaining type issues
  - Deploy final version to Vercel
  - Tag release: `git tag v1.0.0-capstone`
- **Validation**: Production deployment successful, no errors

**T047** Create Capstone presentation materials
- **File**: `specs/001-hockey-go-time/presentation-notes.md`
- **Action**: Document:
  - Key features demonstrated
  - Technical highlights (AI agent, MCP integration, traffic-aware routing)
  - Architecture decisions (timezone handling, caching strategy)
  - Demo script with talking points
- **Validation**: Presentation materials complete

**🎯 FINAL CHECKPOINT**: Feature Complete
- All P1 and P2 user stories implemented and tested
- Production deployment stable
- Demo script rehearsed
- Capstone presentation ready

---

## Deferred Tasks (Post-Capstone)

These tasks are **not** part of the Capstone scope but documented for future work:

### User Story 3 - Hotel Recommendations (P2, deferred)
- Implement `minWakeUpTime` preference field
- Create hotel recommendation logic
- Integrate with hotel search APIs
- Filter games by travel distance

### User Story 6 - Enhanced Team/Venue Information (P4)
- **Venue Address Pipeline** (replaces hardcoded mappings):
  - Scrape all SCAHA venue names across all divisions
  - LLM-based venue name deduplication ("Anaheim Ice" vs "The Rinks - Anaheim" → same venue?)
  - LLM address search with confidence scoring
  - Human-in-the-loop verification for low-confidence matches
  - Store in database/file for agentic RAG retrieval
  - Remove hardcoded mappings from system prompt
- Add team logos and colors
- Add rink photos and maps

### User Story 7 - Multi-League Support (P4)
- Add PGHL MCP server integration
- Create league selection in preferences
- Support multiple league data sources

### User Story 8 - Community Features (P5)
- Create About page
- Implement donation button (Venmo/PayPal)
- Add feedback form
- Set up custom domain
- Implement A/B testing for donation messaging

---

## Dependencies Graph

```
Phase 1 (Setup)
  └─> Phase 2 (Foundational Infrastructure)
        ├─> Phase 3 (User Story 1: Preferences) [P1]
        ├─> Phase 4 (User Story 5 Part 1: In-Memory Cache) [P1]
        ├─> Phase 5 (Routing Fix) [P1]
        └─> Phase 6 (User Story 2: Travel Times) [P2]
              └─> Phase 2 (timezone utilities)

Phase 2 (Foundational Infrastructure)
  └─> Phase 7 (User Story 4: Stats) [P2]
  └─> Phase 8 (User Story 5 Part 2: Supabase Cache) [P2]
        └─> Phase 4 (In-Memory Cache must exist first)

Phase 9 (Polish) - Can start after any user story completes
```

**User Story Completion Order (Capstone)**:
1. **P1 (Week 1)**: US1 (Preferences), US5-Part1 (In-Memory Cache), Routing Fix
2. **P2 (Week 2)**: US2 (Travel Times), US4 (Stats), US5-Part2 (Supabase Cache)
3. **Polish (Week 2-3)**: Testing, deployment, demo preparation

---

## Parallel Execution Opportunities

### Within Phase 2 (Foundational)
Tasks T004-T010 can all run in parallel (different files)

### Within Phase 3 (User Story 1)
- T012 and T013 can run in parallel (different components)
- T014, T015, T016 can run after T011-T013

### Within Phase 6 (User Story 2)
- T023 and T024 can start together (T024 depends on T023 completion)
- T025 already complete (venue mappings added)
- T027 depends on T024, T025, T026

### Within Phase 7 (User Story 4)
- T030, T031, T033 can run in parallel after T029
- T032 depends on all above

### Within Phase 8 (User Story 5 Part 2)
- T034 and T035 can run in parallel
- T036 depends on both T034, T035
- T037-T040 are sequential

### Within Phase 9 (Polish)
Tasks T041-T045 can run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**Goal**: Demonstrate core value in Capstone presentation

**Must Have** (Week 1 - P1):
- ✅ User Preferences (US1)
- ✅ In-Memory Cache (US5-Part1)
- ✅ Routing Fix
- ✅ Type checking passes
- ✅ Production deployment

**High Demo Value** (Week 2 - P2):
- ✅ Travel Time Calculations (US2) - **Key differentiator**
- ✅ Stats Queries (US4) - **MCP capabilities demo**
- ✅ Supabase Cache (US5-Part2) - **Performance showcase**

**Stretch Goals** (If time permits):
- Community features (donation button)
- Enhanced error handling
- Additional venue mappings

### Incremental Delivery
1. **Week 1 End**: P1 features in production (preferences, caching, routing)
2. **Week 2 Mid**: P2 Travel Times in production (biggest demo value)
3. **Week 2 End**: P2 Stats + Supabase Cache in production
4. **Week 3**: Polish, testing, demo rehearsal

### Risk Mitigation
- **SCAHA MCP Stats Tools Missing**: Defer US4 (stats), focus on US2 (travel) - still strong demo
- **Google Routes API Issues**: Implement fallback (distance-based estimates)
- **Supabase Migration Complex**: Keep in-memory cache for demo, Supabase as "future work"
- **Capstone Deadline Pressure**: Prioritize US1 + US2, demo those features only

---

## Success Metrics

**Type Safety**: `pnpm tsc --noEmit` returns zero errors
**Performance**: <1s cached queries, <3s uncached queries (95th percentile)
**Coverage**: 6 out of 8 user stories implemented (US1, US2, US4, US5; defer US3, US6, US7, US8)
**Demo Ready**: Full demo script tested and timed
**Production Stable**: No errors in Vercel deployment logs

---

**Generated**: 2025-10-07
**Total Implementation Tasks**: 47 (42 Capstone scope + 5 deferred)
**Estimated Timeline**: 2.5 weeks (per Capstone deadline)
