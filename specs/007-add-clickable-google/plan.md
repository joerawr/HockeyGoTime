# Implementation Plan: Clickable Google Maps Directions Link

**Branch**: `007-add-clickable-google` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-add-clickable-google/spec.md`

## Summary

Add a clickable Google Maps directions link to all travel time responses. When users ask "When do we need to leave?", the AI response will include a pre-generated URL that opens Google Maps with the user's home address as origin and the venue address as destination. This eliminates the need for users to manually copy/paste addresses into Maps, reducing friction in the most common game-day use case.

**Technical Approach**: Extend the existing `TravelCalculation` type to include a `mapsUrl` field. Generate the URL using Google Maps Directions API format with proper URL encoding. Update the system prompt to instruct the AI to include the link in responses.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15 with App Router)
**Primary Dependencies**:
- Existing: `ai` SDK 5, `@ai-sdk/google` (Gemini)
- New: None (uses standard URL encoding)

**Storage**: N/A (no persistence required)
**Testing**: Manual testing via chat UI (verify link opens correctly on mobile/desktop)
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Link generation adds <1ms to travel calculation response time
**Constraints**:
- Must properly URL-encode addresses to handle special characters
- Link must work on both mobile (deep-link to Maps app) and desktop (web)
- Must integrate seamlessly with existing travel time calculator

**Scale/Scope**: Single enhancement to existing travel calculation feature (3 files modified)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User-Centric AI Experience
✅ **PASS** - Feature reduces friction for hockey parents by eliminating copy/paste step. Link text is user-friendly ("Get directions in Google Maps").

### Principle II: Type Safety & Quality Gates
✅ **PASS** - Will add `mapsUrl?: string` to `TravelCalculation` type. All changes will be verified with `pnpm tsc --noEmit`.

### Principle III: Performance First
✅ **PASS** - URL generation is a simple string concatenation operation (<1ms). No impact on existing cache strategy.

### Principle IV: MCP Integration Correctness
✅ **PASS** - No changes to MCP integration. Feature only modifies travel calculator output.

### Principle V: Package Manager Discipline
✅ **PASS** - No new dependencies required. Uses standard JavaScript `encodeURIComponent()`.

### Principle VI: AI Model Selection
✅ **PASS** - No changes to model selection. AI will naturally include the link when it's present in tool response.

### Principle VII: Deployment Ready
✅ **PASS** - No new environment variables required. Works in Vercel production immediately.

### Architecture Constraints
✅ **PASS** - No timezone handling changes required (uses existing addresses from travel calculator). No new architecture components.

**Gate Status**: ✅ **ALL GATES PASS** - Feature is a straightforward enhancement with no constitution violations.

## Project Structure

### Documentation (this feature)

```
specs/007-add-clickable-google/
├── spec.md              # Feature specification
├── plan.md              # This file
├── data-model.md        # Phase 1 output (minimal - just type update)
├── quickstart.md        # Phase 1 output (usage examples)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

**Files to Modify:**

```
HockeyGoTime/
├── types/
│   └── travel.ts                          # Add mapsUrl field to TravelCalculation type
├── lib/
│   └── travel/
│       └── time-calculator.ts             # Generate mapsUrl in calculateTravelTimes()
└── components/
    └── agent/
        ├── hockey-prompt.ts               # Update prompt to include Maps link in responses
        └── pghl-prompt.ts                 # Update prompt (PGHL also uses travel calculator)
```

**Structure Decision**: This is a modification to existing files only. No new directories or components required. The feature integrates into the established travel time calculation flow.

## Complexity Tracking

*No violations - this section is not applicable.*

## Phase 0: Research

**No research required** - This feature uses:
1. **Standard Google Maps Directions API URL format** (well-documented, stable industry standard)
2. **Standard JavaScript URL encoding** (`encodeURIComponent()`)
3. **Existing travel calculator infrastructure** (no new patterns)

All technical decisions are straightforward and documented in the Google Maps documentation:
- URL Format: `https://www.google.com/maps/dir/?api=1&origin=ADDRESS&destination=ADDRESS&travelmode=driving`
- Reference: https://developers.google.com/maps/documentation/urls/get-started#directions-action

**Skipping research.md creation** - no unknowns or technology choices to document.

## Phase 1: Design & Contracts

### Data Model Changes

**File**: `types/travel.ts`

**Change**: Add one optional field to `TravelCalculation` interface:

```typescript
export interface TravelCalculation {
  // ... existing fields ...

  // NEW: Google Maps directions URL
  mapsUrl?: string;  // e.g., "https://www.google.com/maps/dir/?api=1&origin=..."
}
```

**Rationale**: Optional field allows backward compatibility. URL generation happens in `calculateTravelTimes()` and is guaranteed to be present for all successful calculations.

### Contract Changes

**No API contract changes required** - This is an internal enhancement to the travel calculation response. The AI SDK tool contract remains unchanged (same input parameters, output now includes URL).

**Existing Tool**: `calculate_travel_times`
- **Input**: Unchanged (game details, user preferences)
- **Output**: `TravelCalculation` object (now includes `mapsUrl` field)

### Implementation Flow

1. **Type Update** (`types/travel.ts`):
   - Add `mapsUrl?: string` to `TravelCalculation` interface

2. **URL Generation** (`lib/travel/time-calculator.ts`):
   ```typescript
   // Generate Google Maps directions URL
   const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
     `&origin=${encodeURIComponent(userPreferences.homeAddress)}` +
     `&destination=${encodeURIComponent(options.venueAddress)}` +
     `&travelmode=driving`;

   return {
     // ... existing fields ...
     mapsUrl,
   };
   ```

3. **Prompt Update** (`components/agent/hockey-prompt.ts` and `pghl-prompt.ts`):
   - Add instruction: "When providing travel time calculations, always include the Google Maps link at the end of your response for easy navigation."
   - Example format: "🗺️ [Get directions in Google Maps](MAPS_URL_HERE)"

### Testing Plan

**Manual Testing Scenarios**:

1. **Desktop Browser**:
   - Ask: "When do we need to leave for Sunday's game?"
   - Verify: Response includes clickable Maps link
   - Click link → Google Maps web opens with directions

2. **Mobile Browser (iOS)**:
   - Same query as above
   - Click link → Google Maps app opens (if installed) or web version

3. **Mobile Browser (Android)**:
   - Same query as above
   - Click link → Google Maps app opens (if installed) or web version

4. **Special Characters in Address**:
   - Test with venue "The Rinks - Anaheim ICE (Rink #2)"
   - Verify: URL encoding handles "#" and spaces correctly

5. **Long Addresses**:
   - Test with full address: "23770 S Western Ave, Harbor City, CA 90710"
   - Verify: Link works correctly

**TypeScript Validation**:
- Run `pnpm tsc --noEmit` to verify type safety
- Confirm `mapsUrl` is properly typed as `string | undefined`

## Phase 2: Task Breakdown

**Task generation will be handled by `/speckit.tasks` command.**

**Estimated Complexity**: 3-4 simple tasks (type update, URL generation, prompt updates, testing)

**Estimated Timeline**: <2 hours total implementation time

---

## Design Artifacts Summary

### Created Files

✅ **data-model.md** - Documents the `mapsUrl` field addition to `TravelCalculation` type
✅ **quickstart.md** - Provides implementation examples, testing checklist, and user flow
✅ **plan.md** - This file (complete implementation plan)

### No Contracts Directory

This feature doesn't require contract files because:
- No new API endpoints are created
- Existing `calculate_travel_times` tool contract remains unchanged
- Output type simply includes one additional optional field

## Implementation Readiness

**Status**: ✅ **READY FOR IMPLEMENTATION**

All planning phases complete:
- ✅ Phase 0: Research (skipped - no unknowns)
- ✅ Phase 1: Design & Contracts complete
- ✅ Agent context updated (`CLAUDE.md`)

**Next Step**: Run `/speckit.tasks` to generate the task breakdown for implementation.

**Estimated Timeline**: <2 hours total
- 15 min: Type update
- 30 min: URL generation logic
- 15 min: Prompt updates
- 30 min: Testing (desktop + mobile)
- 15 min: Deploy and verify production

## Constitutional Re-Check (Post-Design)

Re-evaluating all constitution gates after completing design:

### Principle I: User-Centric AI Experience
✅ **PASS** - Design maintains user-friendly approach. Link text is clear ("Get directions in Google Maps"). Works seamlessly on mobile and desktop.

### Principle II: Type Safety & Quality Gates
✅ **PASS** - `mapsUrl?: string` field properly typed. All modifications preserve type safety.

### Principle III: Performance First
✅ **PASS** - URL generation confirmed to be simple string concatenation (<1ms). No caching changes needed.

### Principle IV: MCP Integration Correctness
✅ **PASS** - Zero MCP changes. Feature only adds data to existing tool response.

### Principle V: Package Manager Discipline
✅ **PASS** - No dependencies added. Uses built-in `encodeURIComponent()`.

### Principle VI: AI Model Selection
✅ **PASS** - No model selection changes. Current production model (Gemini 2.5 Flash) will naturally include the link when present.

### Principle VII: Deployment Ready
✅ **PASS** - No environment variables needed. Works in production immediately after deploy.

### Architecture Constraints
✅ **PASS** - No architecture changes. Integrates with existing travel calculator pattern.

**Final Gate Status**: ✅ **ALL GATES PASS** - Ready to proceed to task generation.

---

**Planning Complete**: 2025-10-17
**Ready for**: `/speckit.tasks` command to generate implementation tasks
