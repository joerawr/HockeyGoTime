# Feature Specification: Hockey Go Time - Travel Planning and Stats Enhancement

**Feature Branch**: `001-hockey-go-time`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "Hockey Go Time is an AI-powered chat interface that enables parents and youth hockey players to ask natural language questions about their SCAHA hockey schedules (leveraging existing Scaha MCP server), game times, opponents, and travel logistics. The system computes wake-up times, departure times, and provides hotel suggestions when needed. Can also collect player stats, team stats, and generate end-of-year summaries."

## Clarifications

### Session 2025-10-07

- Q: For the Capstone demo (2.5 weeks), which authentication approach should be used? → A: Client-side only (localStorage) - no authentication, preferences per browser
- Q: Which approach should be used for travel time calculations given the 2.5-week timeline? → A: Google Maps Routes API v2 with real-time traffic using arrivalTime flag (API key already available and tested)
- Q: For the Capstone MVP, how should hotel suggestions be provided? → A: Defer hotel feature to post-Capstone (keep P2 focus on travel time only; low demo appeal with only 1 game requiring hotel for test team)
- Q: For the Capstone MVP, where should schedule/stats cache be stored? → A: In-memory cache (P1 - rapid testing, immediate UX improvement), then upgrade to Supabase server-side cache (P2 - after travel mapping)
- Q: Should Player/Team Statistics (User Story 4, P3) be included in Capstone? → A: Yes, include stats as P2 (below Supabase caching); SCAHA MCP stats tools are part of Capstone presentation and similar to existing MCP implementation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Preferences and Team Association (Priority: P1)

Parents and players need to save their preferences so they can use natural language like "we" and "our team" without repeatedly specifying which team they follow.

**Why this priority**: This is foundational for all other features. Without knowing the user's team and home location, personalized travel calculations and team-specific queries cannot work.

**Independent Test**: Can be fully tested by creating a new user account, setting preferences (team, home address, prep time, game arrival time), and verifying the system remembers these preferences across sessions.

**Acceptance Scenarios**:

1. **Given** a new user visits the system (no localStorage data), **When** they first interact, **Then** the system prompts them for their team, home address, minutes needed to get ready, and minutes needed before game time
2. **Given** a user has saved preferences in localStorage, **When** they ask "when do we play next?", **Then** the system uses their saved team to answer
3. **Given** a user has saved preferences, **When** they return to the system in the same browser, **Then** their preferences are displayed in preference boxes/panels
4. **Given** a user wants to change teams, **When** they update their team preference, **Then** all subsequent queries use the new team and localStorage is updated
5. **Given** multiple users use different browsers or devices, **When** each sets preferences, **Then** each browser maintains independent localStorage (no shared state)

---

### User Story 2 - Travel Time Calculations with Wake-Up and Departure Times (Priority: P2)

Parents need to know when to wake up and when to leave home for games based on rink location, travel time, and their personal preferences for preparation and arrival time.

**Why this priority**: This is a key differentiator that solves a real pain point for hockey parents who often travel to distant rinks for early morning games.

**Independent Test**: Can be tested by setting a user's home address and preferences, selecting a game at a known rink, and verifying the system calculates correct wake-up and departure times based on actual travel distance.

**Acceptance Scenarios**:

1. **Given** a user has set their home address and prep time (30 minutes), **When** they ask "when do I need to leave for Sunday's game?", **Then** the system calculates travel time to the rink and provides departure time accounting for their 30-minute prep time
2. **Given** a user has set their required arrival time (30 minutes before game time), **When** they ask "what time do I need to wake up for the October 5th game?", **Then** the system calculates wake-up time = game time - arrival buffer - travel time - prep time
3. **Given** a game is scheduled at a distant rink, **When** the user asks about departure time, **Then** the system uses current traffic conditions to estimate travel time
4. **Given** real-time traffic data is unavailable, **When** calculating travel time, **Then** the system uses standard distance-based estimates with a buffer
5. **Given** a user asks "when do we need to leave?", **When** their saved team has a game, **Then** the system automatically identifies the next game and calculates departure time

---

### User Story 3 - Hotel Recommendation for Early Games (Priority: P2) **[DEFERRED POST-CAPSTONE]**

Parents need to know when games require overnight accommodation based on their minimum acceptable wake-up time.

**Why this priority**: This helps families plan ahead for tournaments and distant games, avoiding unreasonably early wake-up times.

**Capstone Decision**: Deferred to post-Capstone. Low demo appeal (only 1 game requires hotel for test team). P2 Capstone focus remains on travel time calculations only.

**Independent Test**: Can be tested by setting a user's minimum wake-up time (e.g., 6:00 AM), querying games that would require earlier wake times, and verifying the system recommends hotels with location suggestions.

**Acceptance Scenarios**:

1. **Given** a user has set a minimum wake-up time of 6:00 AM, **When** a game would require waking up at 5:00 AM, **Then** the system recommends getting a hotel and suggests hotels near the rink
2. **Given** a user asks "do I need a hotel for this weekend's game?", **When** the calculated wake-up time is before their minimum, **Then** the system says yes and provides hotel suggestions
3. **Given** a user asks "which games this month need a hotel?", **When** multiple games fall below the wake-up threshold, **Then** the system lists all games requiring overnight stays
4. **Given** a user asks "show me away games more than 2 hours away", **When** filtering the schedule, **Then** the system displays only games meeting the distance criteria
5. **Given** a hotel is recommended, **When** the user views the recommendation, **Then** the system suggests hotels within 10 minutes of the rink

---

### User Story 4 - Player and Team Statistics Tracking (Priority: P2 for Capstone)

Parents and players want to view individual player stats, team performance stats, and generate end-of-season summaries.

**Why this priority**: This adds long-term value but is not essential for the core travel planning functionality. Can be delivered after travel features are working.

**Capstone Decision**: Included as P2 (below Supabase caching). SCAHA MCP stats tools implementation is part of Capstone presentation and similar to existing schedule MCP tool. Demonstrates additional MCP capabilities.

**Independent Test**: Can be tested by collecting stats for a player/team over several games and verifying accurate stat retrieval and end-of-season summary generation.

**Acceptance Scenarios**:

1. **Given** player stats are available via the stats tool, **When** a user asks "show me Johnny's stats", **Then** the system displays goals, assists, points, games played, and other relevant stats
2. **Given** team stats are available, **When** a user asks "how is our team doing?", **Then** the system shows wins, losses, ties, points, and league standing
3. **Given** the season has ended, **When** a user asks "generate an end-of-season summary for my player", **Then** the system creates a summary highlighting key achievements, totals, and memorable games
4. **Given** stats are cached, **When** a user asks for stats, **Then** the system retrieves them quickly without re-scraping
5. **Given** stats have changed, **When** sufficient time has passed, **Then** the system refreshes the cached stats

---

### User Story 5 - Performance Optimization with Caching and Time Awareness (Priority: P1 for in-memory, P2 for Supabase)

Users expect fast responses and accurate date-based queries. The system needs to cache schedule data and understand current date/time for relative queries.

**Why this priority**: Performance and UX improvements that enhance existing features rather than adding new capabilities.

**Capstone Implementation**: Two-phase approach:
- **Phase 1 (P1)**: In-memory cache for rapid testing and immediate UX improvement (lost on page refresh)
- **Phase 2 (P2)**: Upgrade to Supabase server-side cache after travel mapping feature is complete

**Independent Test**: Can be tested by measuring response times for repeated schedule queries and verifying relative date queries ("next game", "this weekend") work correctly.

**Acceptance Scenarios**:

1. **Given** a user previously queried their team's schedule (Phase 1: within same session), **When** they ask about the same schedule again, **Then** the system responds in under 1 second using in-memory cached data
2. **Given** a user asks "when do we play next?", **When** the current date is October 7, 2025, **Then** the system returns the next game after October 7
3. **Given** a user asks about "this weekend", **When** today is Thursday, **Then** the system interprets weekend as Saturday and Sunday of the current week
4. **Given** cached schedule data is stale (Phase 1: session-based, Phase 2: 24-hour TTL in Supabase), **When** sufficient time has passed, **Then** the system refreshes the cache automatically
5. **Given** game times are stored, **When** displaying to users, **Then** the system converts UTC times to the user's local timezone (Pacific Time for SCAHA)

---

### User Story 6 - Enhanced Team and Venue Information (Priority: P4)

Users want to see team colors, logos, and accurate venue addresses for better game day preparation.

**Why this priority**: Nice-to-have enhancements that improve visual appeal and accuracy but aren't critical for core functionality.

**Independent Test**: Can be tested by viewing a game schedule and verifying team logos appear, jersey colors are displayed, and venue addresses are correct.

**Acceptance Scenarios**:

1. **Given** a game is displayed, **When** showing home/away jerseys, **Then** the system displays actual team colors (not just "light" and "dark")
2. **Given** a game is displayed, **When** showing team names, **Then** the system displays team logos next to team names
3. **Given** a venue name doesn't match a known address, **When** mapping the venue, **Then** the system flags it for human verification and correction
4. **Given** a venue has been manually corrected, **When** that venue appears again, **Then** the system uses the corrected address
5. **Given** a user views their schedule, **When** looking at the interface, **Then** the layout is visually appealing with clear typography and spacing

---

### User Story 7 - Multi-League Support (Pacific Girls Hockey League) (Priority: P4)

The system should support multiple youth hockey leagues beyond SCAHA to expand the user base.

**Why this priority**: Future expansion opportunity but not needed for initial launch. SCAHA is the primary market.

**Independent Test**: Can be tested by connecting to the Pacific Girls Hockey League data source and verifying schedule queries work identically to SCAHA.

**Acceptance Scenarios**:

1. **Given** a user selects Pacific Girls Hockey League, **When** they query schedules, **Then** the system retrieves PGHL data instead of SCAHA data
2. **Given** a user is associated with a PGHL team, **When** they ask "when do we play next?", **Then** the system uses PGHL schedule data
3. **Given** multiple leagues are supported, **When** a user sets preferences, **Then** they can select which league their team plays in

---

### User Story 8 - Community Features (Priority: P5)

Users should be able to learn about the project, provide feedback, support development, and access the service via a custom domain.

**Why this priority**: Important for long-term sustainability and community building but not required for functional launch.

**Independent Test**: Can be tested by navigating to About page, clicking donate button, sending feedback email, and accessing via custom domain.

**Acceptance Scenarios**:

1. **Given** a user wants to learn more, **When** they navigate to the About page, **Then** they see information about the project, its purpose, and how it works
2. **Given** a user wants to support the project, **When** they click the donate button, **Then** they are directed to a donation page
3. **Given** a user has feedback, **When** they use the feedback option, **Then** an email is sent to the project maintainer
4. **Given** a user types the custom domain name, **When** accessing the service, **Then** they reach the Hockey Go Time application

---

### Edge Cases

- What happens when a venue address cannot be found or mapped?
- How does the system handle games with TBD times or locations?
- What happens if a user's home address is invalid or cannot be geocoded?
- How does the system respond when asking about a team that doesn't exist in the division?
- What happens when travel time cannot be calculated (mapping service unavailable)?
- How does the system handle games scheduled in multiple timezones (tournaments)?
- What happens when a user asks about "we" but hasn't set a team preference?
- How does the system handle tie games in stats (points calculation)?
- What happens if stats data is unavailable or incomplete for a player/team?
- How does the system handle schedule changes or cancellations after caching?
- What happens when a user asks about a date in the past?
- How does the system respond to ambiguous queries like "next game" during a tournament weekend with multiple games?

## Requirements *(mandatory)*

### Functional Requirements

#### User Preferences and Multi-User Support

- **FR-001**: System MUST prompt new users (no localStorage data) for their team, home address, preparation time (minutes), and game arrival time (minutes before game)
- **FR-002**: System MUST persist user preferences in browser localStorage across sessions (Capstone MVP: client-side only, no authentication)
- **FR-003**: System MUST display current user preferences in visible UI components (preference boxes/panels)
- **FR-004**: Users MUST be able to update their preferences at any time, with changes saved to localStorage
- **FR-005**: System MUST support multiple users via independent browser localStorage (each browser/device maintains separate preferences)
- **FR-006**: System MUST interpret "we", "our team", "us" in queries as references to the user's saved team from localStorage

#### Travel Time and Wake-Up Calculations

- **FR-007**: System MUST calculate travel time from user's home address to game venue using Google Maps Routes API v2 (computeRoutes endpoint) with TRAFFIC_AWARE_OPTIMAL routing preference and arrivalTime parameter set to game time
- **FR-008**: System MUST calculate departure time as: game time - arrival buffer - travel time
- **FR-009**: System MUST calculate wake-up time as: departure time - preparation time
- **FR-010**: System MUST account for traffic conditions via Routes API v2 arrivalTime parameter (predicts traffic at game time)
- **FR-011**: System MUST handle Routes API failures gracefully with user-friendly error messages (e.g., "Unable to calculate travel time - please check addresses")

#### Hotel Recommendations **[DEFERRED POST-CAPSTONE]**

- **FR-012**: [POST-CAPSTONE] Users MUST be able to set a minimum acceptable wake-up time
- **FR-013**: [POST-CAPSTONE] System MUST recommend hotels when calculated wake-up time is before the user's minimum
- **FR-014**: [POST-CAPSTONE] System MUST suggest hotels within a reasonable distance of the game venue (default: 10 minutes)
- **FR-015**: [POST-CAPSTONE] System MUST identify all games in a date range that require hotels based on user's wake-up threshold
- **FR-016**: [POST-CAPSTONE] System MUST filter games by travel distance (e.g., "games more than 2 hours away")

#### Date and Time Awareness

- **FR-017**: System MUST know the current date and timezone to interpret relative queries ("next game", "this weekend", "tomorrow")
- **FR-018**: System MUST convert game times from UTC to the user's local timezone for display
- **FR-019**: System MUST correctly interpret "this weekend" as the upcoming Saturday and Sunday
- **FR-020**: System MUST correctly interpret "next [day of week]" as the next occurrence of that weekday

#### Player and Team Statistics

- **FR-021**: System MUST retrieve player statistics including goals, assists, points, games played, and other relevant metrics
- **FR-022**: System MUST retrieve team statistics including wins, losses, ties, points, and league standing
- **FR-023**: System MUST generate end-of-season summaries highlighting player achievements and memorable games
- **FR-024**: System MUST cache statistics to improve performance

#### Performance and Caching

- **FR-025**: System MUST cache schedule data to reduce load times (Phase 1: in-memory cache; Phase 2: Supabase server-side cache)
- **FR-026**: System MUST respond to cached schedule queries in under 1 second
- **FR-027**: System MUST refresh cached schedule data when it becomes stale (Phase 1: session-based; Phase 2: 24-hour TTL in Supabase)
- **FR-028**: System MUST cache statistics data separately from schedule data (same two-phase approach)

#### Venue and Team Information

- **FR-029**: System MUST map venue names to physical addresses
- **FR-030**: System MUST flag unmapped or ambiguous venue names for human verification
- **FR-031**: System MUST store manually corrected venue addresses for future use
- **FR-032**: System MUST display team jersey colors (actual colors, not just "light" and "dark")
- **FR-033**: System MUST display team logos when available

#### Multi-League Support

- **FR-034**: System MUST support SCAHA (Southern California Amateur Hockey Association) as the primary league
- **FR-035**: System SHOULD support Pacific Girls Hockey League (PGHL) as a secondary league
- **FR-036**: Users MUST be able to select which league their team plays in

#### Error Handling and Validation

- **FR-037**: System MUST validate user home addresses and notify users if addresses cannot be geocoded
- **FR-038**: System MUST gracefully handle missing game times or locations (TBD games)
- **FR-039**: System MUST provide helpful error messages when travel time cannot be calculated
- **FR-040**: System MUST prompt users to set a team preference when they use "we" without having set one
- **FR-041**: System MUST handle queries about non-existent teams with helpful suggestions
- **FR-042**: System MUST notify users when querying dates in the past

#### Community and Informational Features

- **FR-043**: System SHOULD provide an About page explaining the project's purpose
- **FR-044**: System SHOULD provide a way for users to submit feedback
- **FR-045**: System SHOULD provide a donation option for users who want to support the project
- **FR-046**: System SHOULD be accessible via a custom domain name

### Key Entities

- **User**: Represents a parent or player; attributes include team preference, home address, preparation time, game arrival buffer, minimum wake-up time, timezone
- **Team**: Represents a youth hockey team; attributes include team name, division, league, team colors (light and dark), logo, current season
- **Game**: Represents a scheduled hockey game; attributes include date, time, home team, away team, venue, rink, home/away designation for user's team
- **Venue**: Represents a hockey rink facility; attributes include venue name, physical address, geographic coordinates, rink number/name within facility
- **Schedule**: Collection of games for a specific team and season
- **Player Stats**: Represents statistics for an individual player; attributes include goals, assists, points, games played, penalties, plus/minus
- **Team Stats**: Represents statistics for a team; attributes include wins, losses, ties, points, goals for, goals against, league standing
- **Travel Calculation**: Computed information; attributes include origin address, destination address, travel time, departure time, wake-up time, requires hotel (boolean)
- **User Preference**: User's saved settings; attributes include team, home address, prep minutes, arrival buffer minutes, minimum wake-up time

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete initial preference setup in under 2 minutes
- **SC-002**: 90% of users successfully save preferences on first attempt
- **SC-003**: Cached schedule queries respond in under 1 second
- **SC-004**: Travel time calculations complete in under 3 seconds
- **SC-005**: Users asking "when do we play next?" receive accurate results 100% of the time when a game is scheduled
- **SC-006**: Wake-up and departure time calculations are accurate within 5 minutes based on actual travel conditions
- **SC-007**: Hotel recommendations correctly identify games requiring overnight stays based on user's minimum wake-up time
- **SC-008**: System correctly interprets relative date queries ("this weekend", "next game") in 95% of cases
- **SC-009**: Multi-user preference isolation maintains 100% data separation (no user sees another user's team/preferences)
- **SC-010**: Venue address accuracy reaches 95% through manual correction workflow
- **SC-011**: Users can complete common queries (schedule, travel time, stats) in under 10 seconds total
- **SC-012**: System handles 100 concurrent users without performance degradation
- **SC-013**: Schedule data freshness is maintained with automatic cache refresh every 24 hours
- **SC-014**: Player and team statistics display within 2 seconds of query
- **SC-015**: End-of-season summaries successfully generate for 100% of players with complete stats data

### User Satisfaction Outcomes

- **SC-016**: 80% of parents report the travel planning feature saves them time compared to manual calculation
- **SC-017**: Users successfully complete their primary task (schedule query, travel planning, or stats lookup) on first attempt 90% of the time
- **SC-018**: Zero critical bugs related to incorrect game times or team assignments in production

## Assumptions

1. **Timezone**: All SCAHA games are assumed to be in Pacific Time unless explicitly stated otherwise
2. **Traffic Data**: Travel time calculations use Google Maps Routes API v2 with TRAFFIC_AWARE_OPTIMAL and arrivalTime prediction (API key already available and tested in Python)
3. **Hotel Distance**: Default hotel search radius is 10 minutes driving time from venue
4. **Cache TTL**: Schedule data is considered stale after 24 hours by default
5. **Stats Availability**: Player and team stats are available through MCP tools (to be implemented)
6. **User Authentication**: Capstone MVP uses client-side localStorage only (no authentication); post-Capstone may add authentication for cross-device sync
7. **Data Accuracy**: Assumes SCAHA MCP server provides accurate schedule data
8. **Address Validation**: Assumes address geocoding service is available for validating user home addresses
9. **Performance Baseline**: Target performance assumes standard web hosting environment, not high-performance infrastructure
10. **League Priority**: SCAHA is the primary league; PGHL support is secondary and may be delivered later
11. **Device Support**: Assumes responsive design for desktop and mobile browsers (no native mobile app required)
12. **Data Retention**: User preferences and cached data retained indefinitely unless user deletes account
13. **Prep Time Defaults**: If user doesn't specify prep time, assume 30 minutes; if arrival buffer not specified, assume 30 minutes before game time

## Dependencies

1. **SCAHA MCP Server**: Requires existing SCAHA MCP server for schedule data retrieval
2. **Mapping Service**: Requires Google Maps Routes API v2 (routes.googleapis.com/directions/v2:computeRoutes) for travel time calculations with traffic prediction; requires GOOGLE_MAPS_API_KEY environment variable
3. **Player/Team Stats MCP Tools**: Requires implementation of stats tools in SCAHA MCP server (P2 priority for Capstone; similar implementation to existing schedule tool)
4. **Database (Supabase)**: Required for Phase 2 server-side cache (schedule/stats data with 24-hour TTL), venue corrections, and team colors/logos (Note: Phase 1 uses in-memory cache; user preferences always stored client-side in localStorage)
6. **PGHL MCP Server**: Pacific Girls Hockey League support depends on creation of PGHL MCP server (similar to SCAHA)

## Out of Scope

The following are explicitly excluded from this feature:

1. **Native Mobile Apps**: Only web-based responsive interface; no iOS or Android native apps
2. **Live Game Updates**: No real-time score updates or game tracking during games
3. **Social Features**: No team messaging, carpooling coordination, or social networking features
4. **Payment Processing**: Donation feature links to external service; no payment processing in-app
5. **Calendar Integration**: No automatic export to Google Calendar, iCal, or other calendar systems
6. **Notifications**: No push notifications, email alerts, or SMS reminders for upcoming games
7. **Coach/Admin Features**: No roster management, practice scheduling, or team administration tools
8. **Multi-Sport Support**: Hockey only; no support for other youth sports
9. **Tournament Brackets**: No bracket generation or tournament management features
10. **Video/Photo Sharing**: No media upload or sharing capabilities
11. **Offline Mode**: Requires internet connection; no offline functionality
12. **Third-Party Integrations**: No integration with TeamSnap, GameSheet, or other hockey management platforms
