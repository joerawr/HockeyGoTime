# Feature Specification: User Experience Improvements & Bug Fixes

**Feature Branch**: `008-user-feedback-features`
**Created**: 2025-10-17
**Status**: Draft
**Input**: User description: "User feedback features and fixes:
- Dark Mode version. with a switch that is remembered in localStorage
- Add a Skater / Goalie switch in the preferences, but not bulky, that allows the user to select which their player is, and update the player stats to obey the choice unless otherwise prompted.  Defaults to skater.
- The sliding hockey puck animation is slow to appear giving concern that the app doesn't work.  Can we speed that up?  It's about 4-5 seconds on average to appear currently on Vercel.
- More validation that our mapping by arrival time logic is working.
-- From TSPC to Skating edge arrive at 7:40am Sunday morning shows 30 minutes, while Google maps arrive by 7:30 am shows 16-22 minutes
-- From Torrance to Ice Realm was accurate at 25 min for the app, and 20-26 in google map
-- From 1166 E Mountain St, Pasadena, CA 91104 to Ice Realm was 46min for the app and 35-50 for Google Maps, this is acceptable.
-- 2769 Casiano Rd Los Angeles, Ca to Ice Realm was spot on, app 44, Google maps 35-45
- The overall look of HGT is very MVP.  We should look at improved, more stylish design without impact function
- Occasionally when asking questions that call the maps api multiple times, all api calls are successful, but there is not response from the LLM"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dark Mode Toggle (Priority: P1)

A parent using HockeyGoTime late in the evening needs to check game schedules without the bright white interface hurting their eyes or disturbing others in the room.

**Why this priority**: Dark mode is a critical accessibility and user comfort feature. Many parents check schedules in the evening or early morning (before games), and a bright white screen can be disruptive. This affects 100% of users during low-light usage scenarios.

**Independent Test**: Can be fully tested by toggling the dark mode switch in the UI and verifying all components render correctly with appropriate dark theme colors. Delivers immediate value by improving readability in low-light conditions.

**Acceptance Scenarios**:

1. **Given** the user is on any page of HockeyGoTime, **When** they click the dark mode toggle switch, **Then** the entire interface transitions to dark theme with appropriate contrast ratios
2. **Given** the user has enabled dark mode, **When** they close the browser and return later, **Then** their dark mode preference is remembered and automatically applied
3. **Given** the user is in dark mode, **When** they toggle back to light mode, **Then** the interface transitions smoothly to light theme
4. **Given** the user has no saved preference, **When** they visit HockeyGoTime for the first time, **Then** the system defaults to light mode

---

### User Story 2 - Faster Loading Indicator (Priority: P1)

A parent asks a question and sees no immediate feedback, causing them to worry the app is broken or their click didn't register.

**Why this priority**: First impressions are critical. A 4-5 second delay with no feedback creates uncertainty and suggests technical problems, potentially causing users to abandon the app or submit duplicate queries. This affects every user interaction.

**Independent Test**: Can be tested by submitting any query and measuring time until visual feedback appears. Should show loading state within 500ms. Delivers immediate confidence that the system is working.

**Acceptance Scenarios**:

1. **Given** the user submits a question, **When** processing begins, **Then** the loading animation appears within 500 milliseconds
2. **Given** the system is processing a query, **When** the user is waiting, **Then** they see a clear visual indicator that the system is working (animated hockey puck or similar)
3. **Given** the query takes longer than expected, **When** 3 seconds have elapsed, **Then** the user sees a progress indicator or status message (e.g., "Fetching schedule data...")

---

### User Story 3 - Player Position Preference (Priority: P2)

A parent with a goalie child needs to see goalie-specific statistics without having to specify "goalie stats" in every query, since skater statistics are not relevant to their situation.

**Why this priority**: Goalies have completely different statistics than skaters (saves, goals against average vs goals, assists). Showing irrelevant stats creates confusion. This affects approximately 10-15% of users but is critical for that segment.

**Independent Test**: Can be tested by setting player position to "Goalie" in preferences, then requesting player stats without specifying position. System should return goalie-specific metrics. Delivers value by providing relevant statistics automatically.

**Acceptance Scenarios**:

1. **Given** the user opens preferences, **When** they view player settings, **Then** they see a compact "Player Position" selector with "Skater" and "Goalie" options, defaulting to "Skater"
2. **Given** the user has selected "Goalie" as their player position, **When** they ask for player statistics without specifying position, **Then** the system returns goalie-specific metrics (saves, save percentage, goals against average, shutouts)
3. **Given** the user has selected "Skater" as their player position, **When** they ask for player statistics without specifying position, **Then** the system returns skater-specific metrics (goals, assists, points, plus/minus, penalty minutes)
4. **Given** the user has set a default player position, **When** they explicitly request "goalie stats" or "skater stats", **Then** the system overrides the default and returns the requested statistics
5. **Given** the user updates their player position preference, **When** they close and reopen the app, **Then** their position preference is remembered

---

### User Story 4 - Travel Time Accuracy Investigation (Priority: P2)

A parent needs accurate travel time estimates to plan departure times. Specifically, the TSPC to Skating Edge route is showing 30 minutes in HockeyGoTime but only 16-22 minutes in Google Maps for Sunday 7:40am arrival.

**Why this priority**: Inaccurate travel times can cause families to leave unnecessarily early (wasting time) or arrive late (missing warmups/games). This affects user trust in the core feature. While most routes are accurate, outliers must be identified and fixed.

**Independent Test**: Can be tested by comparing travel time estimates for the problematic route (TSPC to Skating Edge, Sunday 7:40am arrival) against Google Maps baseline. Should match within Google Maps' typical range. Delivers trust in the travel time feature.

**Acceptance Scenarios**:

1. **Given** the system calculates travel time from TSPC to Skating Edge for Sunday 7:40am arrival, **When** compared to Google Maps "arrive by 7:40am", **Then** the estimate falls within Google Maps' typical range (16-22 minutes)
2. **Given** multiple test routes have been validated, **When** comparing app estimates to Google Maps, **Then** at least 90% of routes match within Google Maps' typical range
3. **Given** a route shows significant deviation from Google Maps, **When** investigating the cause, **Then** the system logs sufficient debug information to identify whether the issue is with API parameters, iterative convergence, or traffic model settings

---

### User Story 5 - Visual Design Refresh (Priority: P3)

A parent using HockeyGoTime feels the interface looks basic and unpolished compared to other apps they use, reducing confidence in the product quality.

**Why this priority**: Visual design communicates professionalism and quality. An MVP-looking interface may work functionally but creates perception issues. This is P3 because it doesn't affect core functionality, but it does impact user perception and retention.

**Independent Test**: Can be tested through visual review and user feedback. Changes should modernize the appearance without breaking existing functionality. Delivers improved first impressions and professional appearance.

**Acceptance Scenarios**:

1. **Given** the user views any page of HockeyGoTime, **When** comparing to the previous design, **Then** the new design uses modern spacing, typography, and visual hierarchy
2. **Given** the design has been refreshed, **When** testing existing functionality, **Then** all features continue to work as before (no regression)
3. **Given** the user interacts with the interface, **When** hovering over interactive elements, **Then** they see appropriate visual feedback (hover states, transitions)
4. **Given** the new design is applied, **When** viewed on mobile devices, **Then** the improved design remains responsive and functional

---

### User Story 6 - LLM Response Reliability (Priority: P2)

A parent asks a question that requires multiple map API calls. The system successfully fetches all the data, but the AI never responds with the answer, leaving the conversation hanging.

**Why this priority**: Silent failures destroy user trust and waste user time. If the AI doesn't respond after successful API calls, users can't get their answers and may think the app is broken. This is P2 because it's intermittent but critical when it occurs.

**Independent Test**: Can be tested by submitting queries that trigger multiple map API calls (e.g., "compare travel times from three different addresses") and verifying the AI always provides a response. Delivers reliable query completion.

**Acceptance Scenarios**:

1. **Given** the user asks a question requiring multiple map API calls, **When** all API calls complete successfully, **Then** the AI generates and returns a response within 30 seconds
2. **Given** the AI is processing multiple tool calls, **When** any tool call fails or times out, **Then** the AI still provides a response explaining what succeeded and what failed
3. **Given** the system encounters an unexpected error after successful API calls, **When** the error is logged, **Then** sufficient context is captured to debug why the LLM didn't respond
4. **Given** the user is waiting for a response, **When** processing exceeds expected time, **Then** the system shows a status indicator or timeout message rather than hanging indefinitely

---

### Edge Cases

- What happens when the user toggles dark mode repeatedly in rapid succession?
- How does the system handle users with both skater and goalie children who need to switch between position types?
- What happens when travel time API requests timeout but the LLM is waiting for results?
- How does the dark theme handle user-generated content or images that may not look good on dark backgrounds?
- What happens when the user's browser doesn't support localStorage for preference persistence?
- How does the loading indicator behave if the response comes back extremely quickly (under 200ms)?

## Requirements *(mandatory)*

### Functional Requirements

#### Dark Mode (P1)
- **FR-001**: System MUST provide a toggle switch to enable/disable dark mode, accessible from all pages
- **FR-002**: System MUST persist dark mode preference to browser localStorage
- **FR-003**: System MUST apply appropriate color schemes for dark mode that maintain WCAG AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
- **FR-004**: System MUST apply dark mode preference immediately upon toggle without requiring page reload
- **FR-005**: System MUST default to light mode if no preference is stored

#### Loading Performance (P1)
- **FR-006**: System MUST display initial loading indicator within 500 milliseconds of user query submission
- **FR-007**: System MUST show animated loading state while processing queries
- **FR-008**: System MUST display a status message if processing exceeds 3 seconds (e.g., "Fetching schedule data...")

#### Player Position Preference (P2)
- **FR-009**: System MUST provide a "Player Position" selector in user preferences with "Skater" and "Goalie" options
- **FR-010**: System MUST default player position to "Skater" for new users
- **FR-011**: System MUST persist player position preference to browser localStorage
- **FR-012**: System MUST return position-appropriate statistics when user requests player stats without specifying position
- **FR-013**: System MUST override default position when user explicitly requests "goalie stats" or "skater stats"
- **FR-014**: System MUST display player position preference in a compact, non-bulky UI element

#### Travel Time Accuracy (P2)
- **FR-015**: System MUST validate travel time calculations for the identified problematic route (TSPC to Skating Edge)
- **FR-016**: System MUST log sufficient diagnostic information to debug travel time discrepancies
- **FR-017**: System MUST ensure travel time estimates fall within Google Maps' typical range for the same route and arrival time
- **FR-018**: System MUST document any adjustments made to API parameters, convergence logic, or traffic models

#### Visual Design (P3)
- **FR-019**: System MUST update visual design to use modern spacing, typography, and visual hierarchy
- **FR-020**: System MUST maintain all existing functionality during design refresh (no regressions)
- **FR-021**: System MUST provide appropriate visual feedback (hover states, transitions) for interactive elements
- **FR-022**: System MUST ensure design improvements remain responsive across device sizes

#### LLM Response Reliability (P2)
- **FR-023**: System MUST ensure AI generates responses after successful completion of all tool calls
- **FR-024**: System MUST implement timeout handling that provides user feedback if response generation exceeds 30 seconds
- **FR-025**: System MUST log diagnostic information when tool calls succeed but AI fails to respond
- **FR-026**: System MUST provide partial responses or error messages when tool calls fail rather than hanging indefinitely

### Key Entities *(include if feature involves data)*

- **User Preferences**: Collection of user-specific settings including:
  - Dark mode enabled/disabled (boolean)
  - Player position (enum: Skater, Goalie)
  - Team, division, season, home address (existing)
  - Stored in browser localStorage, no backend persistence

- **Player Statistics**: Two distinct types based on position:
  - **Skater Stats**: Goals, assists, points, plus/minus, penalty minutes, games played
  - **Goalie Stats**: Saves, save percentage, goals against average, shutouts, wins, losses, games played

- **Travel Time Diagnostic Data**: Information captured for debugging travel time calculations:
  - Origin address, destination address
  - Requested arrival time
  - Calculated departure time
  - Iteration count and convergence details
  - API response times and durations
  - Traffic model used (PESSIMISTIC)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enable dark mode and see the interface transition to dark theme within 1 second of toggling
- **SC-002**: Loading indicator appears within 500 milliseconds of query submission in 95% of cases
- **SC-003**: Travel time estimate for TSPC to Skating Edge (Sunday 7:40am arrival) falls within 16-24 minutes (matching Google Maps typical range)
- **SC-004**: When users set player position to "Goalie", subsequent stat queries return goalie-specific metrics without requiring position specification
- **SC-005**: Zero instances of successful tool calls followed by no AI response over a 1-week monitoring period
- **SC-006**: User feedback indicates improved visual polish and professionalism (qualitative measure via user interviews or surveys)
- **SC-007**: 90% of travel time estimates across all tested routes match within Google Maps' typical range
- **SC-008**: Users report increased confidence that the app is working due to faster loading feedback (qualitative measure)

## Assumptions

- Browser localStorage is available and enabled for preference persistence
- Users understand the difference between skater and goalie statistics
- The TSPC to Skating Edge travel time discrepancy is caused by a systematic issue in the travel time calculation logic (not a Google Maps API anomaly)
- "TSPC" refers to a known hockey venue in the SCAHA system (assumed Toyota Sports Performance Center or similar)
- Users have modern browsers that support CSS custom properties (CSS variables) for theme switching
- The current loading delay is primarily caused by network latency or backend processing, not client-side rendering
- The intermittent LLM non-response issue occurs when multiple tool calls are involved but is not consistently reproducible
- Visual design improvements will not require major structural changes to the application layout

## Constraints

- Changes must maintain backward compatibility with existing user preferences stored in localStorage
- Dark mode implementation should not significantly increase bundle size or impact initial page load performance
- Player position selector must be compact and fit within existing preferences panel without requiring layout expansion
- Travel time fixes must not break existing accurate route calculations
- Visual design changes must preserve responsive behavior across all device sizes
- All changes must be testable on Vercel preview deployments before merging to production

## Out of Scope

- Backend storage of user preferences (remains localStorage-only)
- Automatic dark mode based on system preferences (manual toggle only)
- Player position switching without opening preferences panel
- Comprehensive UI redesign or rebranding (only polishing existing design language)
- Real-time monitoring dashboard for travel time accuracy
- Automated testing suite for travel time calculations across all venue pairs
- Dark mode for admin or analytics interfaces (focus on user-facing pages only)
- Support for multiple players per family with different positions (single player position preference)
