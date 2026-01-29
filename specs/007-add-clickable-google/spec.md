# Feature Specification: Clickable Google Maps Directions Link

**Feature Branch**: `007-add-clickable-google`
**Created**: 2025-10-17
**Status**: Draft
**Input**: User description: "Add clickable Google Maps directions link to travel time responses"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Navigation to Game Venue (Priority: P1)

A parent asks "What time should we leave for Sunday's game?" and receives travel time calculations. Instead of manually copying the venue address into Google Maps, they click a pre-generated directions link that instantly opens navigation with their home address as the starting point.

**Why this priority**: This is the core value of the feature - reducing friction in the most common use case (getting directions on game day). Without this, users must manually copy/paste addresses, which defeats the purpose of having an AI assistant.

**Independent Test**: User asks for travel time, receives a response containing a clickable link, clicks it, and Google Maps opens with pre-populated origin and destination addresses.

**Acceptance Scenarios**:

1. **Given** a user has saved their home address in preferences, **When** they ask "When do we need to leave for the game at Aliso Viejo Ice?", **Then** the response includes a clickable "Get directions in Google Maps" link
2. **Given** a user clicks the Google Maps link, **When** the link opens, **Then** Google Maps displays a route from their home address to the venue address
3. **Given** the travel response includes game details, **When** the user views the response, **Then** the Maps link appears after all travel time information (wake-up time, departure time, duration)

---

### User Story 2 - Mobile Navigation Support (Priority: P2)

A parent views travel directions on their mobile device while driving to the rink. When they click the Google Maps link, the app opens directly in the Google Maps mobile app (if installed) rather than the mobile browser, providing a better navigation experience.

**Why this priority**: Mobile users represent a significant portion of hockey parents checking directions on game day. The Google Maps URL format automatically handles deep-linking to the mobile app when available.

**Independent Test**: User opens HockeyGoTime on mobile browser, requests travel time, clicks Maps link, and Google Maps app launches (if installed) with directions pre-loaded.

**Acceptance Scenarios**:

1. **Given** a user on iOS with Google Maps app installed, **When** they click the directions link, **Then** the Google Maps app opens with the route
2. **Given** a user on Android with Google Maps app installed, **When** they click the directions link, **Then** the Google Maps app opens with the route
3. **Given** a user without Google Maps app installed, **When** they click the directions link, **Then** Google Maps web version opens in their browser

---

### User Story 3 - Review Route Before Game Day (Priority: P3)

A parent asks about travel time for a game next week. They click the Google Maps link days in advance to review the route, check for alternate routes, or save the location for later reference.

**Why this priority**: Nice-to-have functionality that supports planning ahead, but not critical to core use case (most users check directions on game day itself).

**Independent Test**: User requests travel time for a future game, clicks Maps link, reviews route options and traffic patterns at current time (not game time).

**Acceptance Scenarios**:

1. **Given** a user asks about a game 5 days in the future, **When** they click the Maps link, **Then** Google Maps shows current traffic conditions (not future predictions)
2. **Given** a user has clicked a Maps link, **When** they return to the chat, **Then** the link remains clickable for later reference

---

### Edge Cases

- What happens when a user hasn't saved a home address? **Assumption**: The travel time calculation already fails in this case, so no Maps link is generated
- What happens when the venue address is invalid or cannot be geocoded? **Assumption**: Use the same error handling as the existing travel time calculator - show disclaimer message
- What happens when special characters appear in addresses (e.g., "#" or "&")? System must URL-encode addresses properly to prevent broken links
- What happens on desktop vs mobile? The same URL works for both - Google intelligently redirects to web or app

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a Google Maps directions URL whenever travel time calculations are performed
- **FR-002**: The Maps URL MUST include the user's home address as the origin (from user preferences)
- **FR-003**: The Maps URL MUST include the venue address as the destination (from venue resolution system)
- **FR-004**: The Maps URL MUST specify driving as the travel mode
- **FR-005**: All addresses in the URL MUST be properly URL-encoded to handle special characters
- **FR-006**: The Maps link MUST be formatted as markdown (clickable in chat UI)
- **FR-007**: The Maps link MUST use the Google Maps Directions API URL format: `https://www.google.com/maps/dir/?api=1&origin=ADDRESS1&destination=ADDRESS2&travelmode=driving`
- **FR-008**: The Maps link MUST appear in the AI's response after all travel time details (wake-up time, departure time, duration, venue address)
- **FR-009**: The Maps link text MUST be user-friendly (e.g., "Get directions in Google Maps" or "🗺️ Open in Google Maps")

### Key Entities

- **Travel Calculation Response**: Contains game details, venue address, user's home address, travel duration, and now includes the generated Maps URL
- **Google Maps Directions URL**: A formatted URL string containing origin, destination, and travel mode parameters

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful travel time responses include a clickable Google Maps link
- **SC-002**: Links work correctly on both mobile (iOS/Android) and desktop browsers
- **SC-003**: Clicking a Maps link opens Google Maps with pre-populated origin and destination addresses without user intervention
- **SC-004**: Users can complete the journey from asking "when do we leave?" to having navigation open in under 10 seconds (assuming normal response time)
- **SC-005**: No broken links due to special characters in addresses (proper URL encoding validates)

## Assumptions

- Google Maps Directions API URL format remains stable (industry standard, unlikely to change)
- Users have internet access to open Google Maps (reasonable for a web app)
- The existing travel time calculator already validates venue addresses
- Users prefer Google Maps over other navigation apps (can be extended later if needed)
- The chat UI supports markdown clickable links (already demonstrated in production)

## Out of Scope

- Support for alternative map providers (Apple Maps, Waze) - can be added in future iteration
- Customizing route options (avoid tolls, shortest route, etc.) - users can modify in Maps after clicking
- Embedding an interactive map in the chat UI - simple link is faster and more maintainable
- Storing or tracking which Maps links were clicked - privacy-compliant analytics doesn't track individual actions
