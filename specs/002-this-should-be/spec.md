# Feature Specification: Google Routes Departure Guidance

**Feature Branch**: `002-this-should-be`  
**Created**: 2025-10-08  
**Status**: Draft  
**Input**: User description: "This should be how the google routes api is invoked: User can ask When do we leave? (after asking if there is a game this weekend) and get accurate wake/leave times When do we need to leave for the 14B Jr Kings game on October 5th? When do we need to leave for this Sunday's game? What time do we need to wake up on Sunday [assumes waking up to get ready for Sunday's game] and how long will it take to get there?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get leave and wake times with saved preferences (Priority: P1)

As a hockey parent who already has my team and home details saved, I want to ask “When do we leave?” (or similar follow-ups such as “What time should we wake up?”) and receive a single answer that combines the upcoming game info with Google-calculated travel so I know exactly how to prep my family.

**Why this priority**: This is the primary promise of the feature—turning schedule knowledge into actionable travel timing without extra back-and-forth.

**Independent Test**: Save preferences with a valid address and buffers, ask “When do we leave?” for the next scheduled game, and confirm the response includes wake time, departure time, venue address, and travel duration sourced from Google Routes.

**Acceptance Scenarios**:

1. **Given** the user has a stored home address, prep time, and arrival buffer, **When** they ask “When do we leave?” after confirming an upcoming game, **Then** the assistant returns wake time, leave time, travel duration, and venue address using live Google Routes data.  
2. **Given** the user has already received a Google-calculated travel plan for a game, **When** they follow up with “What time should we wake up?” or “How long will it take to get there?”, **Then** the assistant reuses the existing calculation and answers without re-asking for inputs.

---

### User Story 2 - Provide address when preferences are missing (Priority: P2)

As a first-time or guest user without saved preferences, I want the assistant to ask for the address it should use and then give me the same wake/leave guidance so I can still plan the trip.

**Why this priority**: Supports new or multi-household users who have not stored preferences but still need accurate travel guidance.

**Independent Test**: Clear saved preferences, ask “When should we leave for Sunday’s game?”, supply an address when prompted, and confirm the system returns full travel guidance once the address is provided.

**Acceptance Scenarios**:

1. **Given** the user lacks a stored origin address, **When** they ask for leave time, **Then** the assistant requests an address, confirms the inputs, calls Google Routes, and returns the travel plan.  
2. **Given** the user supplies an address that cannot be resolved, **When** Google cannot return a route, **Then** the assistant explains the issue and asks the user to rephrase or provide a different address.

---

### User Story 3 - Clarify which game to plan for (Priority: P3)

As a parent with multiple upcoming games, I want the assistant to clarify which matchup I mean before giving travel times so I don’t plan for the wrong event.

**Why this priority**: Prevents incorrect travel guidance when multiple games or dates are in play.

**Independent Test**: With multiple future games in context, ask “When do we leave?” and confirm the assistant restates the targeted game or asks the user to pick before calculating travel.

**Acceptance Scenarios**:

1. **Given** multiple future games exist for the team, **When** the user asks for leave time without specifying date/opponent, **Then** the assistant lists the relevant options and only performs travel calculations after the user confirms the target game.  
2. **Given** the user clarifies a specific game, **When** the assistant completes the travel calculation, **Then** the response references the correct opponent, date, and venue for that game.

---

### Edge Cases

- If no future game is identified (e.g., off-weekend or invalid date), the assistant must explain that no travel plan can be generated and guide the user to specify a different date or opponent.  
- When Google Routes returns no viable route (network error, closed roads, invalid address), the assistant should notify the user, offer to retry, and suggest verifying the address or choosing an alternate starting point.
- If the calculated leave time has already passed (e.g., query arrives after recommended departure), the assistant should highlight the missed window and still provide current travel time plus next-best guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The assistant MUST confirm the target game (date, opponent, venue) before generating travel guidance when multiple upcoming games exist or the user’s request is ambiguous.  
- **FR-002**: The assistant MUST gather an origin address, prep time, and arrival buffer—using saved preferences when available, otherwise prompting the user and confirming defaults (45 minutes to get ready, 30 minutes early arrival) before proceeding.  
- **FR-003**: The system MUST invoke Google Routes only after all required details (origin, venue, desired arrival time) are known, and it MUST use the venue address tied to the identified game.  
- **FR-004**: The travel response MUST include, at minimum, the wake time, leave time, drive duration, arrival buffer explanation, and venue address so families can act without additional prompts.  
- **FR-005**: The assistant MUST reuse the latest Google Routes result for follow-up questions within the same conversation thread unless the user changes the origin, destination, or target game.  
- **FR-006**: Users MUST be able to override stored prep or arrival buffers within the conversation, and the assistant MUST recompute travel guidance with the updated values.  
- **FR-007**: If Google Routes fails or exceeds a reasonable timeout, the assistant MUST provide a clear error message, state that live travel data is unavailable, and suggest manual planning steps (e.g., use venue address in a map app).  
- **FR-008**: The assistant MUST record whether the origin information came from preferences, ad-hoc input, or a recent override so future prompts can avoid unnecessary re-requests during the session.

### Key Entities *(include if feature involves data)*

- **GameContext**: Represents the selected matchup (season, division, opponent, puck drop time, venue, rink) that travel guidance references.  
- **TravelPreparation**: Captures origin address, prep buffer, arrival buffer, and the timestamped Google Routes result (duration, distance, suggested departure) associated with a specific GameContext.  
- **UserPreferenceSource**: Indicates whether travel inputs originated from saved preferences, user-provided ad-hoc values, or conversation overrides, enabling smarter follow-up prompts.

### Assumptions

- Default prep (45 minutes) and arrival buffer (30 minutes before puck drop) are acceptable industry-standard baselines when the user does not supply alternatives.  
- Venue addresses are already maintained in the system prompt mapping and remain accurate for Google Routes lookups.  
- Users typically reference the most recently discussed game; the assistant can rely on conversational context but should confirm when ambiguity could cause an incorrect plan.  
- Network connectivity to Google Routes is generally reliable; transient errors should be handled with polite retry guidance rather than forcing the user to restart the conversation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of travel-planning queries with stored preferences yield a complete wake/leave response in a single reply (no additional prompts needed).  
- **SC-002**: For successful Google Routes lookups, the assistant provides travel guidance within 5 seconds of receiving all required information.  
- **SC-003**: In usability testing, 90% of parents report that the travel guidance includes all details they need to prepare (wake time, leave time, venue address, and travel duration).  
- **SC-004**: Fewer than 10% of travel-planning interactions end without guidance due to missing inputs or errors, as measured over a representative sample weekend.  
- **SC-005**: Follow-up questions (“What time do we wake up?”, “How long will it take?”) resolve without re-collecting inputs in at least 90% of cases within the same conversation.
