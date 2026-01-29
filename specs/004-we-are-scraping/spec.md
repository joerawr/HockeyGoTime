# Feature Specification: Scalable Venue Resolution System

**Feature Branch**: `004-we-are-scraping`
**Created**: 2025-10-13
**Status**: Draft
**Input**: User description: "We are scraping SCAHA and PGHL and both use human readable but sometimes confusing names for the venues, making giving the venue name to a mapping api difficult. For the MVP of the schedule agent, I scraped the venues for SCAHA, and did the address translation by hand, and stored it in the system prompt. That works fine, but is not scalable. So I need a better scalable way to do venue to address translation, store it and have the LLM retrieve it."

## User Scenarios & Testing

### User Story 1 - Chat Agent Resolves Venue Automatically (Priority: P1)

A parent asks "What time should we leave for the game at Toyota Sports Center?" The chat agent automatically resolves "Toyota Sports Center" to the correct physical address and provides accurate travel time calculations without requiring manual intervention or hardcoded mappings.

**Why this priority**: This is the core value proposition - eliminating manual venue mapping and enabling accurate travel time calculations. Without this, the system cannot scale beyond the ~30 hand-curated venues.

**Independent Test**: Can be fully tested by querying the resolution service with various venue name variations and verifying it returns consistent canonical addresses with confidence scores. Delivers immediate value by removing the hardcoded venue mapping bottleneck.

**Acceptance Scenarios**:

1. **Given** a scraped venue name "Toyota Sports Center" from SCAHA, **When** the agent calls the resolution service, **Then** it receives the canonical venue with full address, Google Place ID, and confidence score above 0.7
2. **Given** a similar venue name "TSPC" from PGHL, **When** the agent calls the resolution service, **Then** it resolves to the same canonical venue as "Toyota Sports Center"
3. **Given** a venue name with extra noise "Yorba Linda ICE (Rink 2) 2025", **When** normalization is applied, **Then** it matches to "Yorba Linda ICE" canonical venue
4. **Given** an ambiguous venue name with low confidence, **When** the agent receives the response, **Then** it includes top 3 candidate venues with disambiguation guidance

---

### User Story 2 - Bulk Import from Hand-Curated Data (Priority: P1)

An administrator imports the existing hand-curated SCAHA venue mappings (30+ venues with addresses) into the centralized venue database, creating the foundational dataset for fuzzy matching and future expansions.

**Why this priority**: This migration must happen first to preserve existing knowledge and provide the baseline for fuzzy matching. Without this seed data, the system has no reference venues to match against.

**Independent Test**: Can be tested by running the import script with the hand-curated CSV/JSON and verifying all venues and aliases are correctly inserted into the database with proper relationships.

**Acceptance Scenarios**:

1. **Given** a hand-curated mapping file with 30 SCAHA venues, **When** the import script runs, **Then** all venues are inserted with canonical names, addresses, and Google Place IDs
2. **Given** multiple variations of the same venue in the import file, **When** the import completes, **Then** one canonical venue exists with multiple alias records linking to it
3. **Given** an existing venue in the database, **When** importing an updated address, **Then** the venue record is updated without creating duplicates

---

### User Story 3 - Automatic Venue Discovery from Scraped Data (Priority: P2)

The system automatically scrapes SCAHA and PGHL websites to discover all unique venue names mentioned in schedules, normalizes them, and attempts to resolve addresses using external geocoding services, logging all results for admin review.

**Why this priority**: This automates the tedious manual process of finding venue variations and provides a path to handle new venues as they appear in schedules. However, it depends on having the baseline data from P1 stories.

**Independent Test**: Can be tested by running the scraper against live SCAHA/PGHL sites, verifying it extracts unique venue names, attempts geocoding, and logs results with confidence scores for admin review.

**Acceptance Scenarios**:

1. **Given** a SCAHA schedule page with 50 games, **When** the scraper runs, **Then** it extracts all unique venue names and stores them as unresolved aliases
2. **Given** an unresolved alias "Great Park Ice", **When** the geocoding service is called, **Then** it returns address candidates with confidence scores
3. **Given** 10 newly discovered venue aliases, **When** the discovery process completes, **Then** all aliases are stored with source attribution (scaha.net or pacificgirlshockey.com) and flagged for admin review

---

### User Story 4 - Admin Reviews and Confirms Venue Matches (Priority: P2)

An administrator accesses a review UI showing unresolved or low-confidence venue matches, sees the top 3 candidate venues with map pins, and can approve a match, create a new venue, or reject with one click.

**Why this priority**: Human oversight is critical for high-quality venue data. This enables continuous improvement as new venue variations are discovered. Depends on having unresolved aliases from P2.

**Independent Test**: Can be tested by seeding the database with low-confidence matches, accessing the admin UI, and verifying the approve/reject/create workflows update the database correctly.

**Acceptance Scenarios**:

1. **Given** 5 unresolved venue aliases in the system, **When** the admin opens the review UI, **Then** they see a list of aliases with top 3 candidates, confidence scores, and map previews
2. **Given** an alias "Ice in Paradise" with a high-confidence match to existing venue, **When** the admin clicks "Approve", **Then** the alias is linked to the venue and removed from the review queue
3. **Given** an alias "New Rink in San Diego" with no good matches, **When** the admin clicks "Create New Venue", **Then** they enter canonical name and address, and a new venue record is created with the alias linked
4. **Given** a false-positive match, **When** the admin clicks "Reject", **Then** the candidate is marked as incorrect and won't be suggested again for that alias

---

### Edge Cases

- What happens when two different physical venues have very similar names (e.g., "Ontario Ice Center" in Ontario, CA vs Ontario, Canada)?
- How does the system handle venue name changes (e.g., sponsorship changes from "Bud Light Arena" to "Michelob Ultra Arena")?
- What happens when a venue alias matches multiple canonical venues with equal confidence scores?
- How does the system handle venues that close permanently or temporarily?
- What happens when external geocoding services return incorrect addresses or are unavailable?
- How does the system handle venues with multiple addresses (e.g., outdoor rinks that move seasonally)?
- What happens when scraped data contains typos or OCR errors in venue names?

## Requirements

### Functional Requirements

- **FR-001**: System MUST store canonical venue records with unique identifier, canonical name, full address (line1, city, state, zip), Google Place ID, latitude, longitude, and confidence score
- **FR-002**: System MUST store venue aliases with relationship to canonical venues, capturing raw alias text, normalized text, and source attribution
- **FR-003**: System MUST normalize all venue name queries using deterministic rules (lowercase, trim, collapse spaces, remove punctuation, expand abbreviations)
- **FR-004**: System MUST support fuzzy text matching using trigram similarity for venue name lookups
- **FR-005**: System MUST expose a resolution function that accepts a venue name string and returns venue ID, Place ID, full address, coordinates, and confidence score
- **FR-006**: System MUST return top 3 candidate matches when confidence is below 0.7 with disambiguation guidance
- **FR-007**: System MUST support bulk import of venue data from structured files (CSV/JSON) with deduplication
- **FR-008**: System MUST scrape SCAHA and PGHL websites to discover all unique venue names in published schedules
- **FR-009**: System MUST attempt geocoding for newly discovered venues using external service and store results with confidence scores
- **FR-010**: System MUST provide admin interface for reviewing unresolved or low-confidence venue matches
- **FR-011**: Admin interface MUST display top 3 candidate venues with map pins and confidence scores
- **FR-012**: Admin interface MUST allow one-click actions to approve match, reject match, or create new venue
- **FR-013**: System MUST support venue name normalization rules including: common hockey terms (rink/rnk, center/ctr/centre), compass directions (north/N, south/S), rink identifiers (Sheet A, Rink 1), and sponsor variations
- **FR-014**: Resolution function MUST be deterministic - same input always returns same result for a given database state
- **FR-015**: System MUST NOT guess or interpolate addresses - only returns verified venue data from the database
- **FR-016**: System MUST support vector embeddings for venue names (pgvector) for future semantic matching capabilities
- **FR-017**: System MUST NOT log user queries, venue lookups, or any personally identifiable information to comply with privacy guarantees

### Key Entities

- **Venue**: Represents a physical hockey rink/facility. Attributes include unique identifier, canonical name (official/most common name), normalized canonical name (for matching), full address components, Google Place ID (for map integration), coordinates, confidence score (0-1 indicating address accuracy), timestamps, and optional vector embedding for semantic search.

- **Venue Alias**: Represents an alternative name for a venue as seen in scraped data. Attributes include unique identifier, reference to parent venue, raw alias text (as scraped), normalized alias text (after rule application), source attribution (scaha.net, pacificgirlshockey.com, etc.), and match confidence if applicable.

- **Admin Review Queue**: Represents unresolved or low-confidence venue matches awaiting human review. Attributes include alias record, candidate venues with scores, map preview data, and review status. Note: Does NOT contain user queries or PII.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Agent can resolve 95% of SCAHA venue names to correct addresses with confidence above 0.7 without manual intervention
- **SC-002**: Agent can resolve 90% of PGHL venue names to correct addresses with confidence above 0.7 without manual intervention
- **SC-003**: System successfully imports all 30+ hand-curated SCAHA venues without data loss or duplication
- **SC-004**: Fuzzy matching correctly identifies venue name variations with 95% accuracy (e.g., "TSPC" matches "Toyota Sports Performance Center")
- **SC-005**: Venue discovery scraper processes 500+ games across SCAHA and PGHL schedules in under 5 minutes
- **SC-006**: Admin can review and resolve 20 venue aliases in under 10 minutes using the review UI
- **SC-007**: Resolution function responds to queries in under 200ms for 95th percentile
- **SC-008**: Zero instances of agent using incorrect or guessed addresses for travel calculations
- **SC-009**: Venue database grows to support 100+ unique venues across both leagues with aliases
- **SC-010**: System handles venue name changes by maintaining historical aliases without data loss
- **SC-011**: System complies with privacy policy by not logging user queries or personally identifiable information

## Assumptions

- External geocoding service (Google Places API) is available and reliable for address validation
- SCAHA and PGHL website structures remain relatively stable for scraping
- Supabase Postgres free tier provides sufficient storage and query performance for 100-200 venues with 500-1000 aliases
- Admin review workload is manageable (fewer than 50 new aliases per week requiring review)
- Most venue name variations can be normalized using rule-based transformations
- Vector embeddings (pgvector) are optional for MVP and can be added later for semantic matching
- Existing hand-curated venue data is accurate and complete for SCAHA
- Venue addresses change infrequently (less than 5% per year)
- Privacy-compliant design means no user query logging - venue discovery relies solely on scraped schedule data and admin review

## Dependencies

- Supabase account with Postgres database and pg_trgm extension enabled
- Google Places API access for geocoding and Place ID lookup
- Web scraping capability for SCAHA (scaha.net) and PGHL (pacificgirlshockey.com) sites
- Existing hand-curated SCAHA venue mapping data for initial import
- Admin authentication system for venue review UI access

## Out of Scope

- Real-time venue availability or booking integration
- Venue capacity, amenities, or facility details beyond address
- Multi-language venue name support
- Historical tracking of venue location changes over time (just current address)
- Integration with venue booking or scheduling systems
- Automated venue closure detection
- Support for international venues outside California
- Venue ratings or reviews from users
- Automated correction of scraped data typos (admin review handles edge cases)
