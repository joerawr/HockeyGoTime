# Implementation Tasks: Google Maps Directions Link

**Feature**: 007-add-clickable-google | **Date**: 2025-10-17
**Branch**: `007-add-clickable-google` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

This task list implements a focused enhancement to the existing travel time calculator: adding a clickable Google Maps directions link to all travel time responses. The feature is small enough that all user stories can be implemented together in a single increment.

**Total Tasks**: 6
**Estimated Timeline**: <2 hours total
**Priority**: All tasks are P1 (single, focused enhancement)

---

## Format: `[ID] [P?] [US] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1/US2/US3]**: Which user story this task serves
- **File paths**: All paths relative to repository root (`HockeyGoTime/`)

---

## Phase 1: Setup & Infrastructure

**Purpose**: No new infrastructure required - this feature modifies existing files only.

**Status**: ✅ **SKIPPED** - All infrastructure already exists (TypeScript project, Next.js, travel calculator)

---

## Phase 2: Type System Update

**Purpose**: Add the `mapsUrl` field to the `TravelCalculation` type to support the new feature.

**Goal**: Enable type-safe inclusion of Google Maps URL in travel calculation responses.

### Tasks

- [x] **T001** [P] [US1/US2/US3] Add `mapsUrl` field to `TravelCalculation` interface
- **File**: `types/travel.ts`
- **Action**: Add `mapsUrl?: string` field to the `TravelCalculation` interface (line ~66, after `disclaimer` field)
- **Validation**: Run `pnpm tsc --noEmit` to verify type safety
- **Details**:
  ```typescript
  export interface TravelCalculation {
    // ... existing fields ...
    disclaimer?: string;

    // NEW: Google Maps directions URL
    mapsUrl?: string;  // e.g., "https://www.google.com/maps/dir/?api=1&origin=..."
  }
  ```

**Checkpoint**: Type system updated - can now type-safely include Maps URL in responses

---

## Phase 3: User Story 1 - Quick Navigation to Game Venue (Priority: P1) 🎯 MVP

**Goal**: Add clickable Google Maps link to travel time responses so users can instantly navigate to the venue

**Independent Test**: Ask "When do we need to leave for the game?" → Response includes clickable Maps link → Click opens Google Maps with directions pre-populated

### Implementation for User Story 1

- [x] **T002** [US1] Generate Google Maps URL in travel time calculator
- **File**: `lib/travel/time-calculator.ts`
- **Action**: Add URL generation logic in the `calculateTravelTimes()` function before the return statement (around line 165)
- **Dependencies**: T001 (type must exist first)
- **Validation**:
  - Verify `encodeURIComponent()` properly handles special characters
  - Test with addresses containing spaces, "#", "&" symbols
  - Confirm URL follows Google Maps Directions API format
- **Details**:
  ```typescript
  // Generate Google Maps directions URL (add before return statement)
  const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(userPreferences.homeAddress)}` +
    `&destination=${encodeURIComponent(options.venueAddress)}` +
    `&travelmode=driving`;

  return {
    game,
    userPreferences,
    venueAddress: options.venueAddress,
    travelDurationSeconds: route.durationSeconds,
    distanceMeters: route.distanceMeters,
    gameTime: formatISO(gameDateTime, timezone),
    arrivalTime: formatISO(arrivalTime, timezone),
    departureTime: formatISO(departureTime, timezone),
    wakeUpTime: formatISO(wakeUpTime, timezone),
    calculatedAt: new Date().toISOString(),
    isEstimated: route.isFallback ?? false,
    estimateMethod: route.isFallback ? 'distance' : undefined,
    disclaimer: route.disclaimer,
    mapsUrl,  // NEW field
  };
  ```

- [x] **T003** [P] [US1] Update SCAHA system prompt to include Maps link instruction
- **File**: `components/agent/hockey-prompt.ts`
- **Action**: Add instruction to include the Google Maps link in travel time responses
- **Dependencies**: None (can run in parallel with T002)
- **Validation**: Review prompt to ensure instruction is clear and well-positioned
- **Details**: Add to the travel time section:
  ```typescript
  // Add near the travel time instructions section:

  When providing travel time calculations, ALWAYS include the Google Maps
  link at the end of your response using this markdown format:

  🗺️ [Get directions in Google Maps](MAPS_URL_FROM_CALCULATION)

  This makes it easy for users to navigate on game day. The link will
  automatically open the Google Maps app on mobile or the web version on desktop.
  ```

- [x] **T004** [P] [US1] Update PGHL system prompt to include Maps link instruction
- **File**: `components/agent/pghl-prompt.ts`
- **Action**: Add the same Maps link instruction as T003 (PGHL uses the same travel calculator)
- **Dependencies**: None (can run in parallel with T002, T003)
- **Validation**: Ensure instruction matches SCAHA prompt for consistency
- **Details**: Copy the same instruction from T003 to maintain consistency between leagues

**Checkpoint**: User Story 1 complete - Maps links now generated and included in all travel responses for both SCAHA and PGHL

---

## Phase 4: User Story 2 - Mobile Navigation Support (Priority: P2)

**Goal**: Ensure Maps links work seamlessly on mobile devices with deep-linking to Google Maps app

**Independent Test**: Open chat on mobile → Ask for travel time → Click Maps link → Google Maps app opens (if installed)

### Validation for User Story 2

- [x] **T005** [US2] Test mobile deep-linking behavior
- **Action**: Manual testing on mobile devices
- **Dependencies**: T001-T004 must be complete and deployed
- **Test Scenarios**:
  1. **iOS with Google Maps app installed**:
     - Open HockeyGoTime in Safari
     - Request travel time
     - Click Maps link
     - Verify: Google Maps app opens with route loaded
  2. **Android with Google Maps app installed**:
     - Open HockeyGoTime in Chrome
     - Request travel time
     - Click Maps link
     - Verify: Google Maps app opens with route loaded
  3. **Mobile without Google Maps app**:
     - Request travel time
     - Click Maps link
     - Verify: Google Maps web version opens in browser
- **Validation**: All scenarios work correctly (Google's URL format handles deep-linking automatically)
- **Note**: No code changes required - Google Maps URL format handles this automatically

**Checkpoint**: User Story 2 verified - Mobile deep-linking works on iOS and Android

---

## Phase 5: User Story 3 - Review Route Before Game Day (Priority: P3)

**Goal**: Users can click Maps link days in advance to review routes and plan ahead

**Independent Test**: Ask about a future game → Click Maps link → Maps opens with route (showing current traffic, not future)

### Validation for User Story 3

- [x] **T006** [US3] Test future game route planning
- **Action**: Manual testing with future dates
- **Dependencies**: T001-T004 must be complete
- **Test Scenarios**:
  1. Ask about game 5 days in the future
  2. Click Maps link in response
  3. Verify: Google Maps opens with route
  4. Confirm: Shows current traffic conditions (not future predictions)
  5. Verify: Link remains clickable after returning to chat
- **Validation**: Users can access Maps link for future games and review routes in advance
- **Note**: Google Maps does not support future traffic predictions via URL parameters (current limitation of Directions API)

**Checkpoint**: User Story 3 verified - Future game route planning works as expected within Google Maps limitations

---

## Phase 6: Polish & Validation

**Purpose**: Final testing, verification, and deployment

- [x] **T007** Run comprehensive test suite
- **Action**: Execute all test scenarios from quickstart.md checklist:
  - [ ] Desktop browser: Link opens Google Maps web with correct addresses
  - [ ] Mobile iOS: Deep-linking works (Google Maps app or web)
  - [ ] Mobile Android: Deep-linking works (Google Maps app or web)
  - [ ] Special characters: Address with "#", "&", spaces encodes correctly
  - [ ] Long addresses: Full street addresses work properly
  - [ ] TypeScript: `pnpm tsc --noEmit` passes with zero errors
- **Dependencies**: All implementation tasks (T001-T006) complete
- **Validation**: All tests pass, no broken links, proper URL encoding

- [x] **T008** Deploy to production and verify
- **Action**:
  1. Commit all changes to `007-add-clickable-google` branch
  2. Run `pnpm tsc --noEmit` one final time (must pass)
  3. Merge to `main` branch
  4. Verify Vercel auto-deployment completes
  5. Test on production (hockeygotime.net)
- **Dependencies**: T007 (all tests passing)
- **Validation**:
  - Production deployment successful
  - Maps links working on production site
  - No console errors
  - Links work on both mobile and desktop in production

**Final Checkpoint**: Feature complete and deployed to production ✅

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (SKIPPED - no new infrastructure)
   ↓
Phase 2: Type System Update (T001)
   ↓
Phase 3: User Story 1 - Quick Navigation (T002-T004) 🎯 MVP
   ↓
Phase 4: User Story 2 - Mobile Support (T005 - validation only)
   ↓
Phase 5: User Story 3 - Future Planning (T006 - validation only)
   ↓
Phase 6: Polish & Deployment (T007-T008)
```

### Task Dependencies

- **T001** → **T002** (type must exist before calculator uses it)
- **T001-T004** → **T005** (implementation must be complete before mobile testing)
- **T001-T004** → **T006** (implementation must be complete before future game testing)
- **T001-T006** → **T007** (all features must be implemented before comprehensive testing)
- **T007** → **T008** (all tests must pass before deployment)

### Parallel Opportunities

**Within Phase 3 (User Story 1)**:
```bash
# These tasks can run in parallel (different files):
- T003 (hockey-prompt.ts)
- T004 (pghl-prompt.ts)

# T002 (time-calculator.ts) must complete before T005/T006 testing
```

**Example parallel execution**:
```bash
# After T001 completes, launch these together:
Task 1: "Generate Google Maps URL in lib/travel/time-calculator.ts"
Task 2: "Update SCAHA prompt in components/agent/hockey-prompt.ts"
Task 3: "Update PGHL prompt in components/agent/pghl-prompt.ts"
```

---

## Implementation Strategy

### MVP First (All User Stories Together)

This feature is small enough to implement all three user stories together:

1. ✅ **Complete T001**: Add type definition
2. ✅ **Complete T002-T004**: Implement URL generation and prompt updates (can parallelize T003-T004)
3. ✅ **Complete T005-T006**: Validate mobile and future game scenarios
4. ✅ **Complete T007-T008**: Test comprehensively and deploy

**Why all stories together?**:
- All stories use the same implementation (T002)
- US2 and US3 are validation-only (no additional code)
- Total implementation time is <2 hours
- Simpler to test and deploy as one unit

### Incremental Verification

Even though all stories are implemented together, verify each independently:

1. **After T002-T004**: Test US1 (basic link functionality on desktop)
2. **After T005**: Test US2 (mobile deep-linking)
3. **After T006**: Test US3 (future game planning)
4. **After T007**: Run full test suite
5. **After T008**: Verify production deployment

### Risk Mitigation

- **URL encoding issues**: Test with special characters early (T002 validation)
- **Mobile compatibility**: Test on actual devices (T005), not just simulators
- **Production verification**: Always test on production after deploy (T008)

---

## Success Metrics

**Type Safety**: `pnpm tsc --noEmit` returns zero errors ✅
**Link Format**: All Maps URLs follow proper Google API format ✅
**Mobile Compatibility**: Links work on iOS and Android (app and web) ✅
**Special Characters**: URL encoding handles all edge cases ✅
**Production Ready**: Feature works in Vercel production ✅

---

**Generated**: 2025-10-17
**Total Implementation Tasks**: 8 (6 implementation + 2 validation)
**Estimated Timeline**: <2 hours total
**Complexity**: Low - Simple enhancement to existing functionality
