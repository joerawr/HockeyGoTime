# Implementation Plan: Scalable Venue Resolution System

**Branch**: `004-we-are-scraping` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-we-are-scraping/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a scalable venue resolution system that replaces hardcoded venue-to-address mappings with a centralized Supabase database supporting fuzzy text matching. The system will migrate 30+ existing SCAHA venues, automatically discover new venues from scraped schedules, provide an admin UI for reviewing matches, and expose a resolution API for the chat agent - all while maintaining strict privacy guarantees (no user query logging).

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15, Node.js 20+)
**Primary Dependencies**:
- Supabase Client (@supabase/supabase-js) - Database and auth
- PostgreSQL extensions: pg_trgm (fuzzy matching), pgvector (optional semantic search)
- Google Places API - Geocoding and Place ID lookup
- Existing scraping infrastructure (Puppeteer/Cheerio in scaha-mcp and pghl-mcp)

**Storage**: Supabase Postgres (free tier)
- Venues table (canonical records)
- Venue aliases table (many-to-one relationships)
- Admin review queue (unresolved matches)

**Testing**: Manual testing + integration tests for critical paths (venue resolution, normalization logic)
**Target Platform**: Next.js App Router (Vercel deployment)
**Project Type**: Web application (admin UI + API endpoints)
**Performance Goals**:
- Venue resolution: <200ms for 95th percentile
- Fuzzy matching: <100ms for trigram similarity queries
- Bulk import: Process 30+ venues in <5 seconds
- Scraper: Process 500+ games in <5 minutes

**Constraints**:
- MUST NOT log user queries or PII (privacy guarantee)
- MUST be deterministic (same input → same output for given DB state)
- MUST handle 0.7 confidence threshold for disambiguation
- MUST support both SCAHA and PGHL league data sources
- MUST preserve existing hand-curated SCAHA venue data

**Scale/Scope**:
- 100-200 unique venues across both leagues
- 500-1000 venue aliases
- 30+ existing SCAHA venues to migrate
- 2-3 admin users (manual review workload <50 aliases/week)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. User-Centric AI Experience**
- Chat agent gets seamless venue resolution without user intervention
- Natural language venue names (informal input) automatically normalized
- Error messages are user-friendly (never exposes database errors)

**✅ II. Type Safety & Quality Gates**
- All Supabase queries will be typed with generated TypeScript types
- Venue resolution function has explicit return type
- No `any` types except for external API responses (documented)
- `pnpm tsc --noEmit` before completion

**✅ III. Performance First - Caching & Speed**
- Venue lookups cached in-memory (24-hour TTL) for repeated queries
- Supabase connection pooling for query performance
- Normalization logic is stateless and fast (< 1ms)

**✅ IV. MCP Integration Correctness**
- Resolution function exposed as new MCP tool for both SCAHA and PGHL MCPs
- No changes to existing MCP client lifecycle
- Chat agent calls `resolve_venue(name)` before travel time calculations

**✅ V. Package Manager Discipline**
- `pnpm` exclusively for all dependencies
- Document in README: `pnpm run import-venues`, `pnpm run scrape-venues`

**✅ VI. AI Model Selection**
- GPT-5-mini continues as primary model (no changes)
- Resolution logic is deterministic (no LLM calls for matching)

**✅ VII. Deployment Ready**
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_PLACES_API_KEY`
- Document in `.env.local.template`
- Vercel deployment: database migrations via Supabase dashboard

**🔍 Privacy Guarantee (FR-017)**
- NO user query logging
- Venue discovery via scraping public schedules only
- Admin review queue contains only scraped venue names (no user context)

**🔍 Timezone Handling**
- Not applicable - venue resolution is timezone-agnostic
- Addresses and coordinates are static data

## Project Structure

### Documentation (this feature)

```
specs/004-we-are-scraping/
├── plan.md              # This file
├── research.md          # Phase 0: Database schema, normalization rules, API patterns
├── data-model.md        # Phase 1: Venues, aliases, review queue entities
├── quickstart.md        # Phase 1: Setup Supabase, run import, test resolution
├── contracts/           # Phase 1: API contracts for resolution endpoint
│   └── resolve-venue.openapi.yml
└── tasks.md             # Phase 2: Implementation tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```
HockeyGoTime/
├── lib/
│   └── venue/                      # NEW: Venue resolution system
│       ├── client.ts               # Supabase client initialization
│       ├── resolver.ts             # Main resolution function
│       ├── normalizer.ts           # Venue name normalization
│       ├── import.ts               # Bulk import from CSV/JSON
│       └── types.ts                # TypeScript types
│
├── app/
│   └── api/
│       └── venue/                  # NEW: API endpoints
│           ├── resolve/route.ts    # POST /api/venue/resolve
│           └── admin/              # NEW: Admin endpoints
│               ├── queue/route.ts  # GET /api/venue/admin/queue
│               ├── approve/route.ts # POST /api/venue/admin/approve
│               ├── reject/route.ts # POST /api/venue/admin/reject
│               └── create/route.ts # POST /api/venue/admin/create
│
├── app/admin/                      # NEW: Admin UI pages
│   └── venues/
│       └── page.tsx                # Venue review UI
│
├── scripts/                        # NEW: Utility scripts
│   ├── import-venues.ts            # Import hand-curated data
│   └── scrape-venues.ts            # Discover venues from schedules
│
└── supabase/                       # NEW: Database schema
    └── migrations/
        └── 001_venue_resolution.sql # Tables, indexes, functions
```

**scaha-mcp/ and pghl-mcp/ (existing MCP servers)**:
```
scaha-mcp/
└── src/
    └── tools/
        └── resolve_venue.ts        # NEW: MCP tool wrapper

pghl-mcp/
└── src/
    └── tools/
        └── resolve_venue.ts        # NEW: MCP tool wrapper
```

**Structure Decision**: This is a web application with API endpoints and admin UI. The venue resolution logic lives in `lib/venue/` for reusability across API routes and scripts. Admin UI is a separate Next.js page with authentication check. MCP servers get thin wrappers that call the HockeyGoTime API endpoint.

## Complexity Tracking

*No constitution violations - complexity is justified*

This feature introduces new infrastructure (Supabase database) and admin UI, but all additions align with existing architecture patterns. The complexity is inherent to the problem: replacing hardcoded mappings requires persistent storage, fuzzy matching requires a database with trigram support, and human oversight requires an admin interface.

---

## Phase 0: Research & Unknowns

**Prerequisites**: Feature specification complete, constitution check passed

**Unknowns to Resolve**:

1. **Supabase Schema Design**
   - How to structure `venues` table with pg_trgm indexes
   - Foreign key constraints for `venue_aliases`
   - GIN index configuration for fuzzy text matching
   - Row-level security policies for admin access

2. **Normalization Rules**
   - Comprehensive list of hockey venue abbreviations
   - Sponsor name variations (historical mappings)
   - Compass direction standardization
   - Rink identifier patterns

3. **Google Places API Integration**
   - Best practices for geocoding venue names
   - Confidence score interpretation
   - Rate limiting and error handling
   - Place ID storage and validation

4. **Fuzzy Matching Strategy**
   - pg_trgm similarity threshold tuning (how to determine optimal value)
   - Handling equal-confidence ties
   - Performance characteristics at 100-200 venue scale

5. **Admin UI Patterns**
   - Authentication approach (Supabase Auth vs simple password)
   - Map preview integration (Google Maps Embed API vs static maps)
   - Bulk approval workflows

**Research Tasks** (agents will be dispatched):

- Research Supabase pg_trgm implementation patterns for fuzzy text search
- Find best practices for Google Places API geocoding with confidence scoring
- Research venue name normalization rules for sports facilities
- Find patterns for admin review queues with one-click actions
- Research PostgreSQL trigram similarity threshold tuning

**Output**: `research.md` with decisions, rationale, and alternatives for each unknown

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete, all unknowns resolved

**Deliverables**:

1. **data-model.md**: Entity relationship diagram
   - Venue (canonical records)
   - Venue Alias (many-to-one with venues)
   - Admin Review Queue (unresolved matches)
   - Relationships and constraints

2. **contracts/resolve-venue.openapi.yml**: API contract
   - POST /api/venue/resolve
   - GET /api/venue/admin/queue
   - POST /api/venue/admin/approve
   - POST /api/venue/admin/reject
   - POST /api/venue/admin/create

3. **quickstart.md**: Developer setup guide
   - Create Supabase project
   - Run migrations
   - Import hand-curated venues
   - Test resolution endpoint
   - Access admin UI

4. **Agent context update**: Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add Supabase, pg_trgm, Google Places API to tech stack
   - Preserve manual additions

**Output**: Complete design artifacts ready for task generation

---

## Phase 2: Task Generation

**NOT PERFORMED BY THIS COMMAND**

Run `/speckit.tasks` after Phase 1 completion to generate `tasks.md` with dependency-ordered implementation tasks.

---

**Status**: Ready for Phase 0 research
**Next Command**: Agents will be dispatched to resolve research unknowns
