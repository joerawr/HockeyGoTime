# Implementation Plan: Simplified Venue Resolution System

**Branch**: `005-simplified-venue-resolution` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-simplified-venue-resolution/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a simplified venue resolution system using Supabase database with in-memory caching that replaces hardcoded venue-to-address mappings in the system prompt. The system will store 30+ existing SCAHA venues in two database tables, provide a resolution API with <1ms response times via 24-hour TTL cache, support manual cache refresh endpoint, and use Supabase dashboard for admin operations (no custom UI needed). This learning-focused implementation balances production-like architecture with minimal complexity.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15, Node.js 20+)
**Primary Dependencies**:
- Supabase Client (@supabase/supabase-js) - Database access
- Next.js 15 with App Router - API endpoints
- No external geocoding API (using hand-curated data)

**Storage**: Supabase Postgres (free tier)
- `venues` table (id, canonical_name, address, place_id, league)
- `venue_aliases` table (id, venue_id, alias_text)
- Standard B-tree indexes on canonical_name and alias_text

**Testing**: Manual testing for API endpoints and cache behavior
**Target Platform**: Next.js App Router (Vercel deployment)
**Project Type**: Web application (API endpoints only, no UI)

**Performance Goals**:
- Venue resolution: <1ms for cache hits (95th percentile)
- Venue resolution: <100ms for cache misses (95th percentile)
- Cache refresh: Complete for 200 venues in <5 seconds
- Import script: Process 30+ venues in <10 seconds

**Constraints**:
- MUST NOT log user queries or PII (privacy guarantee)
- MUST use separate `venue_aliases` table (not JSON column)
- MUST use in-memory Map cache with 24-hour TTL
- MUST filter by league to prevent cross-league matches
- MUST use Supabase dashboard for admin (no custom UI)

**Scale/Scope**:
- 100-200 unique venues across SCAHA and PGHL
- 500-1000 venue aliases
- 30+ existing SCAHA venues to import
- 2-3 admin users (manual Supabase dashboard access)
- 0-5 new venues added per year

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. User-Centric AI Experience**
- Chat agent gets seamless venue resolution without user intervention
- Venue names normalize automatically (lowercase, trim whitespace)
- Returns null for non-matches, allowing LLM to respond naturally
- No user-facing error messages from venue system (graceful degradation)

**✅ II. Type Safety & Quality Gates**
- All Supabase queries typed with generated TypeScript types
- Venue resolution function has explicit return type: `Promise<Venue | null>`
- No `any` types (all entities fully typed)
- `pnpm tsc --noEmit` required before completion

**✅ III. Performance First - Caching & Speed**
- In-memory Map cache with 24-hour TTL for <1ms lookups
- Supabase connection reuses existing @supabase/supabase-js client
- Cache indexes by id, canonical_name (lowercase), and all aliases (lowercase)
- No network calls for cache hits (95%+ of requests after warmup)

**✅ IV. MCP Integration Correctness**
- Resolution API exposed at `POST /api/venue/resolve` for MCP tools to call
- No changes to existing MCP client lifecycle
- Chat agent calls resolution API via tool before travel time calculations
- MCP servers (SCAHA, PGHL) can add `resolve_venue` tool wrapper if needed

**✅ V. Package Manager Discipline**
- `pnpm` exclusively for all dependencies
- Document in README: `pnpm run import-venues`, API endpoints
- Add Supabase client to package.json via `pnpm add @supabase/supabase-js`

**✅ VI. AI Model Selection**
- No changes to GPT-5/GPT-5-mini model selection
- Venue resolution is deterministic (no LLM calls for matching)
- LLM handles "venue not found" scenarios gracefully

**✅ VII. Deployment Ready**
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Document in `.env.local.template`
- Vercel deployment: database tables created via Supabase dashboard
- Manual cache refresh endpoint for immediate updates after admin changes

**🔍 Privacy Guarantee (FR-016)**
- NO user query logging
- Venue discovery via manual admin entry (not scraping user queries)
- Resolution API logs only errors, not input venue names

**🔍 Timezone Handling**
- Not applicable - venue resolution is timezone-agnostic
- Addresses are static data (no time-based logic)

## Project Structure

### Documentation (this feature)

```
specs/005-simplified-venue-resolution/
├── plan.md              # This file
├── research.md          # Phase 0: Supabase patterns, caching strategy, import format
├── data-model.md        # Phase 1: Venues and venue_aliases entities
├── quickstart.md        # Phase 1: Setup Supabase, run import, test resolution
├── contracts/           # Phase 1: API contract for resolution endpoint
│   └── resolve-venue.openapi.yml
└── tasks.md             # Phase 2: Implementation tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```
HockeyGoTime/
├── lib/
│   └── venue/                      # NEW: Venue resolution system
│       ├── client.ts               # Supabase client initialization
│       ├── cache.ts                # In-memory cache with 24h TTL
│       ├── resolver.ts             # Main resolution function
│       └── types.ts                # TypeScript types (Venue, VenueAlias)
│
├── app/
│   └── api/
│       └── venue/                  # NEW: API endpoints
│           ├── resolve/route.ts    # POST /api/venue/resolve
│           └── refresh-cache/route.ts # POST /api/venue/refresh-cache
│
├── scripts/                        # NEW: Utility scripts
│   └── import-venues.ts            # Import hand-curated CSV data
│
└── supabase/                       # NEW: Database schema (reference only)
    └── migrations/
        └── 001_venues.sql          # Tables, indexes (created via Supabase dashboard)
```

**Structure Decision**: This is a web application with API endpoints only. The venue resolution logic lives in `lib/venue/` for reusability across API routes and scripts. No custom admin UI - admins use Supabase dashboard directly. Import script runs locally via `pnpm tsx scripts/import-venues.ts`. MCP servers can optionally add thin tool wrappers that call the HockeyGoTime resolution API endpoint.

## Complexity Tracking

*No constitution violations - complexity is justified*

This feature introduces database infrastructure (Supabase) which adds operational complexity, but aligns with the user's explicit learning goal: "my gut says we don't need the DB, but I am here to learn, so let's try it." The simplified approach cuts all unnecessary complexity:

- ❌ No pg_trgm fuzzy matching (start with exact/substring)
- ❌ No Google Places API (trust hand-curated data)
- ❌ No custom admin UI (use Supabase dashboard)
- ❌ No automated scraping (manual entry is fine)
- ❌ No confidence scoring (exact matches only)

**Why database vs JSON file**: Decouples venue data from app deployment (update venues without redeploying Next.js app). Supabase free tier is massive (500MB, 50K users) and this uses <1%. Production-like learning experience without overbuilding.

---

## Phase 0: Research & Unknowns

**Prerequisites**: Feature specification complete, constitution check passed

**Unknowns to Resolve**:

1. **Supabase Schema Design**
   - Table definitions for `venues` and `venue_aliases`
   - Foreign key constraints and indexes
   - RLS policies (Row-Level Security) needed or skip for MVP?
   - UUID vs serial for primary keys

2. **In-Memory Cache Strategy**
   - Map data structure design (how to index by multiple keys)
   - Cache initialization pattern (on first request vs app startup)
   - Thread safety concerns for Next.js serverless functions
   - TTL expiration check pattern (background job vs check-on-access)

3. **CSV Import Format**
   - Expected CSV schema for hand-curated SCAHA venue data
   - How to represent aliases in CSV (separate file vs columns)
   - Duplicate detection strategy
   - Error handling for malformed data

4. **Resolution Matching Logic**
   - Exact match algorithm (case-insensitive, trimmed)
   - Substring match fallback behavior
   - Handling multiple substring matches (first match vs error)
   - League filtering approach

5. **Supabase Client Initialization**
   - Singleton pattern vs per-request instantiation
   - Environment variable validation
   - Connection pooling defaults
   - Error handling for database unavailability

**Research Tasks**:

No external research agents needed - all questions can be answered with direct implementation decisions based on Next.js and Supabase best practices. This is an intentionally simple design.

**Output**: `research.md` with implementation decisions and rationale for each unknown

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete, all unknowns resolved

**Deliverables**:

1. **data-model.md**: Entity relationship diagram
   - Venue (canonical records with id, canonical_name, address, place_id, league)
   - Venue Alias (many-to-one with venues via venue_id foreign key)
   - Relationships and constraints

2. **contracts/resolve-venue.openapi.yml**: API contract
   - POST /api/venue/resolve (input: venue name + league, output: Venue | null)
   - POST /api/venue/refresh-cache (no input, output: success status)

3. **quickstart.md**: Developer setup guide
   - Create Supabase project
   - Run SQL migration to create tables (copy-paste SQL from plan)
   - Configure environment variables in `.env.local`
   - Import hand-curated venues via script
   - Test resolution endpoint with curl
   - Manually refresh cache

4. **Agent context update**: Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add Supabase to tech stack
   - Note: No pg_trgm, no custom admin UI
   - Preserve manual additions

**Output**: Complete design artifacts ready for task generation

---

## Phase 2: Task Generation

**NOT PERFORMED BY THIS COMMAND**

Run `/speckit.tasks` after Phase 1 completion to generate `tasks.md` with dependency-ordered implementation tasks.

---

**Status**: Ready for Phase 0 research (implementation decisions only, no external research needed)
**Next Command**: Continue with Phase 0 to document implementation decisions in `research.md`
