# Feature Specification: Simplified Venue Resolution System

**Feature Branch**: `005-simplified-venue-resolution`
**Created**: 2025-10-13
**Status**: Draft
**Input**: User description: "Simplified venue resolution system with Supabase database, in-memory caching, and manual admin workflow"

## User Scenarios & Testing

### User Story 1 - Chat Agent Resolves Venue from Database (Priority: P1)

A parent asks "What time should we leave for the game at Toyota Sports Center?" The chat agent queries the venue resolution API, which returns the canonical venue address from the in-memory cache in under 1ms, enabling accurate travel time calculations.

**Why this priority**: This is the core value proposition - replacing hardcoded system prompt mappings with a scalable database solution that doesn't require redeploying the app when venues change.

**Independent Test**: Can be fully tested by querying the resolution API with various venue names and verifying it returns consistent addresses. Delivers immediate value by decoupling venue data from application deployment.

**Acceptance Scenarios**:

1. **Given** a venue "Toyota Sports Center" exists in database, **When** the agent calls `/api/venue/resolve`, **Then** it receives the canonical address from in-memory cache in under 1ms
2. **Given** a venue alias "TSPC" exists for "Toyota Sports Center", **When** the agent queries "TSPC", **Then** it resolves to the same canonical venue
3. **Given** a venue name with extra noise "Yorba Linda ICE Rink 2", **When** substring matching is applied, **Then** it matches "Yorba Linda ICE" canonical venue
4. **Given** a venue name that doesn't exist in database, **When** resolution is attempted, **Then** it returns null and LLM handles gracefully

---

### User Story 2 - Bulk Import Existing SCAHA Venues (Priority: P1)

An administrator runs a one-time import script to load 30+ existing hand-curated SCAHA venues from CSV into the Supabase database, creating the foundational dataset for the resolution system.

**Why this priority**: This migration preserves existing knowledge and provides the baseline venue data. Without this seed data, the system has no venues to match against.

**Independent Test**: Can be tested by running the import script with the hand-curated CSV and verifying all venues and aliases are correctly inserted into Supabase with proper relationships.

**Acceptance Scenarios**:

1. **Given** a CSV file with 30 SCAHA venues (canonical name, address, place_id), **When** the import script runs, **Then** all venues are inserted into the `venues` table
2. **Given** venue aliases in the import data, **When** the import completes, **Then** each alias is inserted into `venue_aliases` table with correct `venue_id` foreign key
3. **Given** duplicate venue names in the import file, **When** the import runs, **Then** duplicates are skipped and a warning is logged

---

### User Story 3 - Admin Adds New Venue via Supabase Dashboard (Priority: P2)

An administrator discovers a new venue mentioned in a schedule. They open the Supabase dashboard, insert a new row into the `venues` table with canonical name, address, and place_id, then trigger a cache refresh so the venue is immediately available.

**Why this priority**: This enables ongoing maintenance without requiring code changes or redeployment. Manual admin workflow is acceptable given venues are added infrequently (0-5 per year).

**Independent Test**: Can be tested by inserting a venue via Supabase dashboard, calling the cache refresh endpoint, and verifying the new venue resolves correctly.

**Acceptance Scenarios**:

1. **Given** admin access to Supabase dashboard, **When** a new venue row is inserted, **Then** the venue is stored with id, canonical_name, address, place_id, and league
2. **Given** a new venue was just added to database, **When** admin calls `POST /api/venue/refresh-cache`, **Then** in-memory cache is invalidated and reloaded with new venue
3. **Given** a venue needs an alias added, **When** admin inserts row into `venue_aliases` table, **Then** the alias is linked via `venue_id` foreign key

---

### User Story 4 - Automatic Cache Refresh on TTL Expiration (Priority: P2)

The in-memory venue cache automatically expires after 24 hours. When the next venue resolution request occurs, the system fetches fresh data from Supabase and rebuilds the cache, ensuring eventual consistency without manual intervention.

**Why this priority**: This provides a safety net for when admins forget to manually refresh the cache. It also handles scenarios where cache becomes stale due to server restarts or deployments.

**Independent Test**: Can be tested by seeding cache, waiting for TTL expiration (or manually resetting timestamp), and verifying next resolution request triggers a database fetch.

**Acceptance Scenarios**:

1. **Given** venue cache was last refreshed 24 hours ago, **When** a venue resolution request is made, **Then** cache is invalidated and fresh data is fetched from Supabase
2. **Given** cache is being refreshed due to TTL expiration, **When** resolution request arrives during refresh, **Then** request waits for refresh to complete before returning result
3. **Given** cache refresh completes successfully, **When** subsequent resolution requests arrive within 24-hour window, **Then** all requests are served from in-memory cache without database queries

---

### Edge Cases

- What happens when Supabase database is temporarily unavailable during cache refresh?
- How does system handle venue names with special characters or unicode (e.g., "Anaheim ICE – East")?
- What happens when two venues have very similar names that could match via substring (e.g., "Ontario Ice Center" vs "Ontario Ice Center East")?
- How does system handle case sensitivity in venue name matching?
- What happens when a venue address changes (e.g., rink relocates)?
- What happens when multiple aliases for different venues have overlapping text patterns?
- How does system handle empty or whitespace-only venue name queries?

## Requirements

### Functional Requirements

- **FR-001**: System MUST store venues in Supabase with unique identifier, canonical name, full address, Google Place ID, and league (SCAHA or PGHL)
- **FR-002**: System MUST store venue aliases in separate table with relationship to canonical venues via foreign key
- **FR-003**: System MUST load all venues and aliases into in-memory cache on first API request
- **FR-004**: System MUST expire in-memory cache after 24 hours and refresh from database on next request
- **FR-005**: System MUST provide manual cache refresh endpoint at `POST /api/venue/refresh-cache`
- **FR-006**: System MUST normalize venue queries (lowercase, trim whitespace) before matching
- **FR-007**: Resolution logic MUST attempt exact match first, then fall back to substring matching
- **FR-008**: Resolution API MUST filter results by league (SCAHA or PGHL) to prevent cross-league matches
- **FR-009**: Resolution API MUST return null when no match is found, allowing LLM to handle gracefully
- **FR-010**: System MUST provide bulk import script that loads venues from CSV format
- **FR-011**: Import script MUST skip duplicate canonical names and log warnings
- **FR-012**: System MUST support adding venues and aliases manually via Supabase dashboard
- **FR-013**: Cache refresh MUST rebuild all indexes (by id, canonical name, and aliases) for fast lookups
- **FR-014**: Resolution response time MUST be under 1ms for cache hits (95th percentile)
- **FR-015**: Resolution response time MUST be under 100ms for cache misses requiring database fetch (95th percentile)
- **FR-016**: System MUST NOT log user queries or personally identifiable information to comply with privacy guarantees

### Key Entities

- **Venue**: Represents a physical hockey rink/facility. Attributes include unique identifier (UUID), canonical name (official name), full address (single text field), Google Place ID (for map integration), and league (SCAHA or PGHL).

- **Venue Alias**: Represents an alternative name for a venue as seen in scraped data or user queries. Attributes include unique identifier (UUID), foreign key reference to parent venue, and alias text (the alternative name string).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Chat agent can resolve 95% of SCAHA venue names to correct addresses without manual intervention
- **SC-002**: Chat agent can resolve 90% of PGHL venue names to correct addresses without manual intervention
- **SC-003**: System successfully imports all 30+ hand-curated SCAHA venues without data loss or duplication
- **SC-004**: Venue resolution responds in under 1ms for cached lookups (95th percentile)
- **SC-005**: Admin can add a new venue via Supabase dashboard and see it live within 1 minute using manual refresh
- **SC-006**: Cache automatically refreshes within 24 hours of expiration without manual intervention
- **SC-007**: System handles venue name variations (aliases) correctly, matching "TSPC" to "Toyota Sports Performance Center"
- **SC-008**: Zero instances of agent using incorrect addresses due to cache staleness
- **SC-009**: Venue database supports 100+ unique venues across both leagues with aliases
- **SC-010**: System maintains 100% uptime during Supabase maintenance windows by serving from cache

## Assumptions

- Supabase Postgres free tier provides sufficient storage and query performance for 100-200 venues with 500-1000 aliases
- Existing hand-curated SCAHA venue data is accurate and complete (30+ venues with addresses and Google Place IDs)
- New venues are added infrequently (0-5 per year based on historical data)
- Admin is comfortable using Supabase dashboard for manual data entry
- Google Place IDs remain stable over time and don't require periodic validation
- Substring matching is sufficient for handling venue name variations (no fuzzy matching needed initially)
- In-memory cache fits comfortably in Next.js server memory (estimated <1MB for 200 venues)
- 24-hour cache TTL is acceptable balance between freshness and database load
- Most venue queries will be exact or substring matches (no need for sophisticated NLP)
- Privacy-compliant design means no user query logging - only venue names from public schedules are stored

## Dependencies

- Supabase account with Postgres database for venue storage
- Existing hand-curated SCAHA venue mapping data for initial import
- Google Place IDs for all venues (already available in hand-curated data)
- Next.js 15 app with App Router for API endpoints
- Access to update environment variables for Supabase credentials

## Out of Scope

- Automatic venue discovery via web scraping (manual admin entry is sufficient)
- Admin UI for venue management (use Supabase dashboard instead)
- Fuzzy text matching with pg_trgm or vector embeddings (start simple, add later if needed)
- Google Places API integration for address validation (trust hand-curated data)
- Confidence scoring or disambiguation logic (exact/substring matching only)
- Automated detection of venue name changes or closures
- Historical tracking of venue address changes over time
- Real-time cache invalidation via database webhooks
- Multi-region deployment or cache distribution
- Venue capacity, amenities, or facility details beyond address
