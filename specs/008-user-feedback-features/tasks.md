# Tasks: User Experience Improvements & Bug Fixes

**Input**: Design documents from `/specs/008-user-feedback-features/`
**Prerequisites**: plan.md, spec.md, research.md
**Branch**: `008-user-feedback-features`
**Tests**: Manual testing with `pnpm tsc --noEmit` and Vercel preview deployments (no automated tests)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and shared utilities needed across all user stories

- [x] T001 [P] [Setup] Create theme types in `types/theme.ts` (Theme = 'light' | 'dark')
- [x] T002 [P] [Setup] Extend UserPreferences type in `types/preferences.ts` with darkMode: boolean and playerPosition: 'skater' | 'goalie'
- [x] T003 [P] [Setup] Update PreferencesStore schema in `lib/storage/preferences.ts` to support darkMode and playerPosition fields

**Checkpoint**: Type definitions ready - user story implementation can now begin in parallel

---

## Phase 2: User Story 1 - Dark Mode Toggle (Priority: P1) 🎯

**Goal**: Enable users to toggle dark mode with localStorage persistence, improving readability in low-light conditions

**Independent Test**: Toggle dark mode switch → entire interface transitions to dark theme → refresh page → dark mode preference persists

### Implementation for User Story 1

- [x] T004 [US1] Create ThemeProvider component in `components/theme/theme-provider.tsx` with React Context for theme state management, localStorage persistence, and `.dark` class toggling on document.documentElement
- [x] T005 [US1] Create DarkModeToggle component in `components/ui/preferences/dark-mode-toggle.tsx` using useTheme hook with Moon/Sun icons from lucide-react
- [x] T006 [US1] Wrap app with ThemeProvider in `app/layout.tsx` (add provider above existing content, inside <body>)
- [x] T007 [US1] Add DarkModeToggle to PreferencePanel component in `components/ui/preferences/PreferencePanel.tsx` (place after League Data Source selector, before Edit/Clear buttons)
- [x] T008 [US1] Test dark mode on all pages (page.tsx, dashboard, privacy, about) - verify no visual regressions
- [x] T009 [US1] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: Dark mode should toggle instantly (<1s), persist across sessions, work on all pages

---

## Phase 3: User Story 2 - Faster Loading Indicator (Priority: P1) 🎯

**Goal**: Show loading indicator within 500ms of query submission to provide immediate user feedback

**Independent Test**: Submit query → loading indicator appears within 100ms → indicator remains until AI starts streaming response

### Implementation for User Story 2

- [ ] T010 [US2] Add `isSubmitting` state to ChatAssistant component in `components/chat/chat-assistant.tsx` (set true on submit, false when streaming starts)
- [ ] T011 [US2] Create handleSubmit function in `components/chat/chat-assistant.tsx` that sets isSubmitting=true immediately before calling sendMessage
- [ ] T012 [US2] Add useEffect in `components/chat/chat-assistant.tsx` to reset isSubmitting when status changes to "streaming" or "completed"
- [ ] T013 [US2] Update loading indicator condition in `components/chat/chat-assistant.tsx` to `showLoading = isSubmitting || status === "streaming"`
- [ ] T014 [US2] (Optional) Add elapsed time tracker in `components/chat/chat-assistant.tsx` to show "Fetching schedule data..." message after 3 seconds
- [ ] T015 [US2] Update SlidingPuck component in `components/ui/sliding-puck.tsx` to accept optional message prop for progressive status updates
- [ ] T016 [US2] Test loading indicator timing with DevTools Performance tab - verify <500ms appearance
- [ ] T017 [US2] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: Loading indicator appears immediately on submit, improves perceived responsiveness by 50x (4-5s → <100ms)

---

## Phase 4: User Story 3 - Player Position Preference (Priority: P2)

**Goal**: Allow users to set player position (Skater/Goalie) to receive position-appropriate statistics by default

**Independent Test**: Set player position to "Goalie" in preferences → ask for player stats without specifying position → system returns goalie-specific metrics (saves, GAA, SV%, SO)

### Implementation for User Story 3

- [ ] T018 [P] [US3] Create PlayerPositionSelector component in `components/ui/preferences/player-position-selector.tsx` using Radix UI Select with "Skater" (default) and "Goalie" options
- [ ] T019 [P] [US3] Add buildHockeyPrompt function in `components/agent/hockey-prompt.ts` that conditionally adds goalie context when playerPosition === 'goalie'
- [ ] T020 [P] [US3] Add buildPGHLPrompt function in `components/agent/pghl-prompt.ts` that conditionally adds goalie context when playerPosition === 'goalie'
- [ ] T021 [US3] Add PlayerPositionSelector to PreferenceForm component in `components/ui/preferences/PreferenceForm.tsx` (place after division field, before homeAddress)
- [ ] T022 [US3] Update hockey-chat API route in `app/api/hockey-chat/route.ts` to call buildHockeyPrompt(preferences) instead of using static HOCKEY_SYSTEM_PROMPT
- [ ] T023 [US3] Update pghl-chat API route (if exists) to call buildPGHLPrompt(preferences) instead of using static PGHL_SYSTEM_PROMPT
- [ ] T024 [US3] Test goalie position preference - request player stats without specifying position, verify goalie metrics returned
- [ ] T025 [US3] Test explicit override - set goalie preference, request "skater stats", verify skater metrics returned
- [ ] T026 [US3] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: Player position preference persists, defaults to skater, returns position-appropriate stats, allows explicit override

---

## Phase 5: User Story 4 - Travel Time Accuracy Investigation (Priority: P2)

**Goal**: Diagnose and fix TSPC to Skating Edge travel time discrepancy (30 min vs Google Maps 16-22 min)

**Independent Test**: Calculate travel time from TSPC to Skating Edge for Sunday 7:40am arrival → result falls within 16-24 minutes (Google Maps typical range)

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create debug script in `scripts/validate-tspc-route.ts` to query venue database for TSPC and Skating Edge addresses, log canonical names and aliases
- [ ] T028 [P] [US4] Add debug logging to `lib/travel/google-routes.ts` - log arrival time (local), arrival time (UTC), departure time (UTC), traffic model, origin/destination addresses
- [ ] T029 [US4] Add debug logging to `lib/travel/time-calculator.ts` - log venue resolution results, iteration count, convergence details
- [ ] T030 [US4] Run validate-tspc-route.ts script with `pnpm tsx scripts/validate-tspc-route.ts` - verify TSPC resolves to correct address (Toyota Sports Performance Center, El Segundo, CA)
- [ ] T031 [US4] Test TSPC to Skating Edge route with query "How long to get from TSPC to Skating Edge for a 7:40am Sunday game?" - capture debug logs
- [ ] T032 [US4] Compare logged addresses with Google Maps autocomplete - identify if venue mapping or timezone conversion is the issue
- [ ] T033 [US4] Fix identified issue (either update venue database entry or fix timezone conversion logic)
- [ ] T034 [US4] Re-test TSPC to Skating Edge route - verify estimate falls within 16-24 minutes range
- [ ] T035 [US4] Test other routes to ensure fix didn't break existing accurate calculations (Torrance to Ice Realm, Pasadena to Ice Realm, LA to Ice Realm)
- [ ] T036 [US4] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: TSPC to Skating Edge travel time matches Google Maps range, other routes remain accurate, debug logging helps diagnose future issues

---

## Phase 6: User Story 6 - LLM Response Reliability (Priority: P2)

**Goal**: Ensure AI always responds after successful tool calls, implement timeout handling for multi-tool-call scenarios

**Independent Test**: Submit query requiring multiple map API calls (e.g., "compare travel times from three addresses") → AI provides response within 30 seconds or shows timeout error

### Implementation for User Story 6

- [ ] T037 [US6] Add request timeout to hockey-chat API route in `app/api/hockey-chat/route.ts` - create AbortController with 25s timeout, pass abortSignal to streamText
- [ ] T038 [US6] Add timeout error handling in `app/api/hockey-chat/route.ts` - catch AbortError, return 504 response with user-friendly message
- [ ] T039 [US6] Add onFinish logging in `app/api/hockey-chat/route.ts` - log finish reason, tool call count, response text length, warn if empty response after successful tool calls
- [ ] T040 [US6] Add client-side timeout in `components/chat/chat-assistant.tsx` - useEffect that sets timeout when status="streaming", shows error state after 30s
- [ ] T041 [US6] Create timeout error UI state in `components/chat/chat-assistant.tsx` - display user-friendly message "Request took too long. Please try again."
- [ ] T042 [US6] Test multi-tool-call scenario - ask "Compare travel times from TSPC, Torrance, and Pasadena to Ice Realm at 7am Sunday" - verify response or timeout error
- [ ] T043 [US6] Test timeout handling - simulate slow response (if possible) or verify timeout logic with shorter timeout value during testing
- [ ] T044 [US6] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: LLM always responds or shows timeout error, no more silent failures, debug logs help diagnose empty response issues

---

## Phase 7: User Story 5 - Visual Design Refresh (Priority: P3)

**Goal**: Modernize visual design with improved typography, spacing, hover states, and depth without restructuring layouts

**Independent Test**: Visually review all pages → typography hierarchy clear, spacing generous, hover states smooth, design feels polished → test on mobile → responsive behavior maintained

### Implementation for User Story 5

- [ ] T045 [P] [US5] Add typography base styles to `app/globals.css` - h1, h2, h3 with proper font-weight and line-height, p with leading-relaxed
- [ ] T046 [P] [US5] Add transition-smooth utility class to `app/globals.css` - transition-property: all, transition-duration: 200ms, ease-in-out timing
- [ ] T047 [P] [US5] Update button component in `components/ui/button.tsx` - add transition-smooth class, hover:scale-[1.02] effect, ensure focus-visible ring is prominent
- [ ] T048 [P] [US5] Update card component in `components/ui/card.tsx` - add shadow-md by default, increase border radius to 0.75rem, add hover:shadow-lg for interactive cards
- [ ] T049 [US5] Update message component in `components/ai-elements/message.tsx` - increase padding to 16px, improve line-height, add subtle background differentiation for user vs assistant
- [ ] T050 [US5] Update PreferencePanel in `components/ui/preferences/PreferencePanel.tsx` - increase internal spacing, add hover states to Edit/Clear buttons, improve section header hierarchy
- [ ] T051 [US5] Update input component in `components/ui/input.tsx` - ensure consistent focus states, add transition-smooth
- [ ] T052 [US5] Test visual changes on all pages (page.tsx, dashboard, privacy, about) - verify typography hierarchy, spacing, hover states
- [ ] T053 [US5] Test responsive behavior on mobile devices - verify design improvements work on small screens
- [ ] T054 [US5] Test keyboard navigation - verify focus states are visible and accessible
- [ ] T055 [US5] Run `pnpm tsc --noEmit` to verify no TypeScript errors

**Checkpoint**: Visual design feels modern and polished, typography hierarchy clear, hover states smooth, spacing generous, no functional regressions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks, documentation, and deployment preparation

- [ ] T056 [P] [Polish] Update README.md with new features (dark mode toggle, player position preference, improved loading feedback)
- [ ] T057 [P] [Polish] Test all 6 user stories together - verify no conflicts or regressions between features
- [ ] T058 [P] [Polish] Test dark mode with all other features (player position, loading indicator, travel time, LLM responses, visual design)
- [ ] T059 [Polish] Verify WCAG AA contrast ratios for dark mode using browser DevTools or online contrast checker
- [ ] T060 [Polish] Test localStorage backward compatibility - verify existing preferences still work with new darkMode and playerPosition fields
- [ ] T061 [Polish] Run `pnpm tsc --noEmit` final verification - ensure zero TypeScript errors
- [ ] T062 [Polish] Deploy to Vercel preview - test all features in production-like environment
- [ ] T063 [Polish] Create pull request to development branch with summary of changes and testing performed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 - Dark Mode (Phase 2)**: Depends on Setup (T001 theme types)
- **User Story 2 - Loading Indicator (Phase 3)**: Independent - can start after Setup
- **User Story 3 - Player Position (Phase 4)**: Depends on Setup (T002 preferences types)
- **User Story 4 - Travel Time (Phase 5)**: Independent - can start immediately (investigation/debugging)
- **User Story 6 - LLM Reliability (Phase 6)**: Independent - can start immediately
- **User Story 5 - Visual Design (Phase 7)**: Can start after US1 (dark mode) to ensure styles work in both themes
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Dark Mode)**: Requires T001 (theme types) from Setup
- **US2 (Loading Indicator)**: No dependencies on other stories - fully independent
- **US3 (Player Position)**: Requires T002 (preferences types) from Setup
- **US4 (Travel Time)**: No dependencies - investigation can happen anytime
- **US6 (LLM Reliability)**: No dependencies - timeout handling independent of other features
- **US5 (Visual Design)**: Should be done after US1 to verify styles work in dark mode

### Recommended Execution Order (Sequential)

1. **Phase 1 (Setup)**: T001-T003 - Type definitions (15 minutes)
2. **Phase 2 (US1 - Dark Mode)**: T004-T009 - P1 feature (1-2 hours)
3. **Phase 3 (US2 - Loading Indicator)**: T010-T017 - P1 feature (1 hour)
4. **Phase 4 (US3 - Player Position)**: T018-T026 - P2 feature (1-2 hours)
5. **Phase 6 (US6 - LLM Reliability)**: T037-T044 - P2 feature (1-2 hours)
6. **Phase 5 (US4 - Travel Time)**: T027-T036 - P2 investigation (2-3 hours)
7. **Phase 7 (US5 - Visual Design)**: T045-T055 - P3 feature (2-3 hours)
8. **Phase 8 (Polish)**: T056-T063 - Final checks (1 hour)

**Total Estimated Time**: 10-15 hours

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T001 (theme types), T002 (preferences types), T003 (storage update) can all run in parallel

**Within US1 (Dark Mode)**:
- T004 (ThemeProvider) and T005 (DarkModeToggle) can be created in parallel

**Within US3 (Player Position)**:
- T018 (component), T019 (hockey prompt), T020 (pghl prompt) can be created in parallel

**Within US4 (Travel Time)**:
- T027 (debug script) and T028 (google-routes logging) can be added in parallel

**Within US5 (Visual Design)**:
- T045-T052 (all component updates) can run in parallel

**Within Polish**:
- T056 (README), T057 (integration test), T058 (dark mode test) can run in parallel

**Across User Stories (if team capacity allows)**:
- After Setup completes, US2 (Loading Indicator) and US4 (Travel Time) and US6 (LLM Reliability) can all proceed in parallel (independent)
- US1 (Dark Mode) and US3 (Player Position) can proceed in parallel after Setup
- US5 (Visual Design) should wait for US1 to complete

---

## Parallel Example: Setup Phase

```bash
# Launch all Setup tasks together (different files):
Task: "Create theme types in types/theme.ts"
Task: "Extend UserPreferences type in types/preferences.ts"
Task: "Update PreferencesStore schema in lib/storage/preferences.ts"
```

## Parallel Example: User Story 3 (Player Position)

```bash
# Launch component and prompt updates together (different files):
Task: "Create PlayerPositionSelector component in components/ui/preferences/player-position-selector.tsx"
Task: "Add buildHockeyPrompt function in components/agent/hockey-prompt.ts"
Task: "Add buildPGHLPrompt function in components/agent/pghl-prompt.ts"
```

---

## Implementation Strategy

### MVP First (P1 Features Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: US1 - Dark Mode (T004-T009)
3. Complete Phase 3: US2 - Loading Indicator (T010-T017)
4. **STOP and VALIDATE**: Test both P1 features together
5. Deploy to Vercel preview for user feedback

**MVP Deliverable**: Dark mode toggle + instant loading feedback (highest user impact)

### Incremental Delivery (Add P2 Features)

1. MVP complete (P1 features deployed)
2. Add Phase 4: US3 - Player Position (T018-T026)
3. Add Phase 6: US6 - LLM Reliability (T037-T044)
4. Add Phase 5: US4 - Travel Time Investigation (T027-T036)
5. **VALIDATE**: Test P2 features independently and with P1 features
6. Deploy updated Vercel preview

### Full Feature Set (Add P3 Feature)

1. P1 + P2 features complete and validated
2. Add Phase 7: US5 - Visual Design Refresh (T045-T055)
3. Complete Phase 8: Polish (T056-T063)
4. **FINAL VALIDATION**: Test all 6 user stories together
5. Create PR to development branch
6. Merge to development → auto-deploy to production

---

## Notes

- **Type Safety**: Run `pnpm tsc --noEmit` after each user story phase
- **Testing**: Manual testing only - no automated test suite for this feature
- **Deployment**: Vercel preview deployments for integration testing
- **[P] tasks**: Different files, can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability (US1-US6)
- **Independent Stories**: Each user story delivers value independently
- **Checkpoints**: Validate after each user story phase before proceeding
- **Backward Compatibility**: T060 ensures existing preferences still work
- **Performance**: T016 measures loading indicator timing with DevTools
- **Accessibility**: T054, T059 verify focus states and contrast ratios

## File Change Summary

**Total Files Modified/Created**: ~20 files

**Created**:
- `types/theme.ts`
- `components/theme/theme-provider.tsx`
- `components/ui/preferences/dark-mode-toggle.tsx`
- `components/ui/preferences/player-position-selector.tsx`
- `scripts/validate-tspc-route.ts`

**Modified**:
- `types/preferences.ts`
- `lib/storage/preferences.ts`
- `app/layout.tsx`
- `components/ui/preferences/PreferencePanel.tsx`
- `components/ui/preferences/PreferenceForm.tsx`
- `components/chat/chat-assistant.tsx`
- `components/ui/sliding-puck.tsx`
- `components/agent/hockey-prompt.ts`
- `components/agent/pghl-prompt.ts`
- `app/api/hockey-chat/route.ts`
- `lib/travel/google-routes.ts`
- `lib/travel/time-calculator.ts`
- `app/globals.css`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ai-elements/message.tsx`
- `README.md`

**Priority Distribution**:
- P1 (Critical): 2 user stories (Dark Mode, Loading Indicator) - 17 tasks
- P2 (Important): 3 user stories (Player Position, Travel Time, LLM Reliability) - 30 tasks
- P3 (Enhancement): 1 user story (Visual Design) - 11 tasks
- Setup + Polish: 9 tasks

**Total Tasks**: 63 tasks across 6 user stories + setup + polish
