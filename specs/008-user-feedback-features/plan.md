# Implementation Plan: User Experience Improvements & Bug Fixes

**Branch**: `008-user-feedback-features` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-user-feedback-features/spec.md`

## Summary

This feature implements six user-requested improvements and bug fixes to HockeyGoTime: dark mode toggle with localStorage persistence, player position preference (Skater/Goalie) for appropriate statistics, faster loading indicators (<500ms), investigation and fix of travel time calculation discrepancies (TSPC to Skating Edge route), visual design modernization, and LLM response reliability improvements for multi-tool-call scenarios. The implementation focuses on enhancing user experience without breaking existing functionality, with particular attention to performance (loading feedback) and accuracy (travel time estimates).

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode, React 19.1.0, Next.js 15.5.3
**Primary Dependencies**:
- AI SDK 5 (`ai` ^5.0.44) with Google AI (`@ai-sdk/google` ^2.0.17)
- Tailwind CSS v4 (`tailwindcss` ^4)
- Radix UI components (`@radix-ui/*` for accessible UI primitives)
- date-fns with timezone support (`date-fns` ^4.1.0, `date-fns-tz` ^3.2.0)
- MCP SDK (`@modelcontextprotocol/sdk` ^1.18.2)

**Storage**: Browser localStorage for user preferences (dark mode, player position, team settings); Supabase (`@supabase/supabase-js` ^2.75.0) for venue database; Upstash Redis (`@upstash/redis` ^1.35.6) for optional caching

**Testing**: Manual testing with `pnpm tsc --noEmit` for type safety; Vercel preview deployments for integration testing

**Target Platform**: Web (Vercel deployment), modern browsers with localStorage and CSS custom properties support

**Project Type**: Next.js 15 App Router application with server and client components

**Performance Goals**:
- Loading indicator appears within 500ms of query submission (P1)
- Dark mode toggle completes within 1 second (P1)
- Travel time calculations remain under 3 seconds (existing requirement)
- LLM responses complete within 30 seconds for multi-tool-call scenarios (P2)

**Constraints**:
- Must maintain backward compatibility with existing localStorage preferences
- Dark mode implementation cannot significantly increase bundle size
- Player position selector must fit within existing preferences panel without layout expansion
- Travel time fixes must not break currently accurate route calculations
- Visual design changes must preserve responsive behavior across device sizes
- All changes must work in Vercel production environment

**Scale/Scope**:
- 6 user stories (2 P1, 3 P2, 1 P3)
- 26 functional requirements across 6 feature areas
- Estimated changes: ~15-20 files affected (components, styles, API routes, prompts)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User-Centric AI Experience
- ✅ **PASS**: Dark mode and faster loading indicators directly improve user experience
- ✅ **PASS**: Player position preference reduces unnecessary clarifying questions
- ✅ **PASS**: 12-hour AM/PM time format already in use; no changes needed
- ✅ **PASS**: Travel time accuracy improvements reduce user friction

**Rationale**: All features prioritize hockey parent and player experience with minimal technical burden.

### Principle II: Type Safety & Quality Gates (NON-NEGOTIABLE)
- ✅ **PASS**: All code will run `pnpm tsc --noEmit` before completion
- ✅ **PASS**: TypeScript strict mode already enabled (`tsconfig.json` line 7)
- ⚠️ **ATTENTION**: New localStorage fields (darkMode, playerPosition) require type definitions

**Action Required**: Create type-safe localStorage utility with schema validation.

### Principle III: Performance First - Caching & Speed
- ✅ **PASS**: Loading indicator optimization targets <500ms response
- ✅ **PASS**: Travel time investigation ensures accuracy within existing performance constraints
- ⚠️ **ATTENTION**: Dark mode theme switching must not cause layout thrash or re-renders

**Action Required**: Use CSS custom properties (CSS variables) for theme switching to avoid component re-renders.

### Principle IV: MCP Integration Correctness
- ✅ **PASS**: No MCP client lifecycle changes required for this feature
- ✅ **PASS**: LLM response reliability fix investigates AI SDK streaming, not MCP transport
- ⚠️ **ATTENTION**: Player position preference affects system prompt sent to AI via MCP tools

**Action Required**: Update hockey-prompt.ts and pghl-prompt.ts to include player position context when calling player stats tools.

### Principle V: Package Manager Discipline
- ✅ **PASS**: No new dependencies outside npm/pnpm ecosystem
- ✅ **PASS**: All commands documented use `pnpm` exclusively

### Principle VI: AI Model Selection & Fallback Strategy
- ✅ **PASS**: No AI model changes required; GPT-5-mini with 'low' effort remains default
- ⚠️ **ATTENTION**: System prompts updated to include player position context

**Action Required**: Verify updated prompts don't exceed token limits with GPT-5-mini.

### Principle VII: Deployment Ready & Environment Configuration
- ✅ **PASS**: No new environment variables required
- ✅ **PASS**: Dark mode and player position use localStorage (client-side only)
- ✅ **PASS**: All changes testable on Vercel preview deployments

### Architecture Constraints: Next.js App Router
- ✅ **PASS**: Dark mode toggle uses React Context (client component)
- ✅ **PASS**: Preferences panel already client component; player position fits naturally
- ✅ **PASS**: Loading indicators use AI SDK streaming states (client component)

### Architecture Constraints: Timezone Handling & Time Display
- ✅ **PASS**: Travel time investigation uses existing `date-fns-tz` infrastructure
- ✅ **PASS**: No changes to time display format (already 12-hour AM/PM)
- ⚠️ **ATTENTION**: TSPC to Skating Edge discrepancy may reveal timezone conversion bug

**Action Required**: Add debug logging to travel time calculations to diagnose issue.

### Architecture Constraints: Venue Address Resolution
- ✅ **PASS**: No venue resolution changes in this feature
- ✅ **N/A**: Travel time accuracy uses existing venue database

### Architecture Constraints: Monetization & Sustainability
- ✅ **N/A**: Donation button deferred (P5 priority, Capstone scope)

### Architecture Constraints: Styling & Components
- ✅ **PASS**: Dark mode uses Tailwind CSS v4 custom properties
- ✅ **PASS**: Player position selector uses Radix UI primitives (consistent with existing preferences)
- ✅ **PASS**: Visual design refresh applies Tailwind utilities only

**Constitution Check Result**: ✅ **PASSED** with minor action items (type safety for localStorage, theme performance, prompt updates, debug logging)

## Project Structure

### Documentation (this feature)

```
specs/008-user-feedback-features/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (data schemas)
├── quickstart.md        # Phase 1 output (implementation guide)
├── contracts/           # Phase 1 output (API contracts - N/A for this feature)
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```
app/
├── layout.tsx                      # [MODIFY] Add dark mode provider wrapper
├── page.tsx                        # [MODIFY] Update for dark mode styles
├── dashboard/                      # [MODIFY] Apply dark mode styles
├── api/
│   └── hockey-chat/
│       └── route.ts                # [MODIFY] Add LLM timeout handling, debug logging
├── privacy/                        # [MODIFY] Dark mode styles
└── about/                          # [MODIFY] Dark mode styles

components/
├── agent/
│   ├── hockey-prompt.ts            # [MODIFY] Add player position context
│   └── pghl-prompt.ts              # [MODIFY] Add player position context
├── ui/                             # [MODIFY] Dark mode styles for all shadcn components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── [others]
├── ai-elements/                    # [MODIFY] Faster loading indicators
│   ├── chat.tsx
│   └── loading-animation.tsx       # [MODIFY OR CREATE] Optimize puck animation timing
├── preferences/                    # [CREATE OR MODIFY] Preferences panel components
│   ├── preferences-panel.tsx       # [MODIFY] Add player position selector
│   ├── dark-mode-toggle.tsx        # [CREATE] Dark mode switch component
│   └── player-position-selector.tsx # [CREATE] Skater/Goalie compact selector
└── theme/
    └── theme-provider.tsx          # [CREATE] React Context for dark mode state

lib/
├── travel/
│   ├── time-calculator.ts          # [MODIFY] Add debug logging for TSPC investigation
│   └── google-routes.ts            # [MODIFY] Log API params and responses
├── preferences/                    # [CREATE] Type-safe localStorage utilities
│   ├── types.ts                    # [CREATE] TypeScript schemas for preferences
│   ├── storage.ts                  # [CREATE] localStorage read/write with validation
│   └── defaults.ts                 # [CREATE] Default values (darkMode: false, playerPosition: 'skater')
└── analytics/                      # [MODIFY] Track dark mode usage, player position selection

styles/
├── globals.css                     # [MODIFY] Add dark mode CSS variables
└── themes/
    ├── light.css                   # [CREATE OR MODIFY] Light theme color tokens
    └── dark.css                    # [CREATE] Dark theme color tokens (WCAG AA contrast)

types/
├── preferences.ts                  # [CREATE] User preferences type definitions
└── theme.ts                        # [CREATE] Theme-related type definitions

scripts/
└── validate-tspc-route.ts          # [CREATE] Debug script for TSPC to Skating Edge route
```

**Structure Decision**: Single Next.js App Router project with server/client component separation. Feature implementation spans multiple layers: UI components (dark mode, preferences), API routes (LLM reliability), system prompts (player position), and styling (visual refresh). No new backend services or databases required; all preferences stored client-side in localStorage per specification.

## Complexity Tracking

*No Constitution violations requiring justification. All gates passed.*

This feature adheres to all constitutional principles with minor implementation details flagged for attention during Phase 1 design (type-safe localStorage, theme performance optimization, prompt token limits, debug logging).

---

## Phase 0: Outline & Research

**Status**: 🔄 In Progress

### Research Tasks

The following unknowns must be resolved before Phase 1 design:

1. **Dark Mode Implementation Strategy**
   - **Unknown**: Best approach for dark mode in Tailwind CSS v4 with Next.js 15 App Router
   - **Research Questions**:
     - How to use Tailwind v4 CSS custom properties for theme switching?
     - Should we use `next-themes` library or custom React Context?
     - How to prevent flash of unstyled content (FOUC) on page load?
     - How to ensure WCAG AA contrast ratios for all components?
   - **Output**: Technical decision on dark mode architecture

2. **Loading Indicator Performance**
   - **Unknown**: Why does loading indicator currently take 4-5 seconds to appear on Vercel?
   - **Research Questions**:
     - Is delay caused by AI SDK streaming initialization?
     - Is delay caused by network latency to AI API?
     - Is delay caused by client-side component hydration?
     - Is delay caused by MCP client connection overhead?
   - **Output**: Root cause analysis and optimization strategy

3. **TSPC to Skating Edge Travel Time Discrepancy**
   - **Unknown**: Why does this specific route show 30 minutes vs Google Maps' 16-22 minutes?
   - **Research Questions**:
     - Is TSPC venue address correctly mapped in database?
     - Is Skating Edge venue address correctly mapped in database?
     - Are there timezone conversion issues affecting arrival time calculation?
     - Is iterative convergence failing for this route?
     - Is PESSIMISTIC traffic model too conservative for Sunday morning?
   - **Output**: Root cause diagnosis and fix approach

4. **LLM Non-Response Investigation**
   - **Unknown**: What causes AI to not respond after successful multi-tool-call scenarios?
   - **Research Questions**:
     - Is this an AI SDK streaming timeout issue?
     - Is this a Google AI API rate limit issue?
     - Is this a prompt token limit issue causing truncation?
     - Is this related to MCP tool call error handling?
   - **Output**: Error reproduction steps and fix strategy

5. **Player Position Context in System Prompts**
   - **Unknown**: How to efficiently pass player position preference to AI without bloating every prompt?
   - **Research Questions**:
     - Should player position be in base system prompt or added conditionally?
     - Does adding player position context affect token usage significantly?
     - How do we override player position when user explicitly requests opposite type?
   - **Output**: Prompt engineering approach for position-aware stats

6. **Visual Design Modernization Scope**
   - **Unknown**: Which specific design elements need improvement without "comprehensive redesign"?
   - **Research Questions**:
     - What are industry-standard spacing/typography patterns for conversational AI apps?
     - Which components look most "MVP" currently?
     - How can we improve visual hierarchy without restructuring layouts?
     - What hover states/transitions are missing?
   - **Output**: Design system improvements checklist

**Research Dispatch Strategy**: Use Task agents for independent research items (1-6 above), consolidate findings in `research.md`.

---

## Phase 1: Design & Contracts

**Status**: ⏳ Not Started (blocked on Phase 0)

### Data Models

To be generated in `data-model.md` after Phase 0 research completes:

- User Preferences schema (localStorage)
- Theme configuration schema
- Player position enum
- Travel time diagnostic data structure

### API Contracts

**N/A for this feature**: No new API endpoints required. Changes are client-side (dark mode, preferences) or modifications to existing `/api/hockey-chat/route.ts` (LLM reliability, debug logging).

### Quickstart Guide

To be generated in `quickstart.md` after Phase 1 completes:

- How to test dark mode locally
- How to test player position preference with MCP tools
- How to reproduce TSPC travel time issue
- How to trigger LLM non-response scenario
- How to verify visual design improvements

### Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude` after Phase 1 completes to update `.specify/memory/constitution.md` or Claude-specific context files with new technology decisions from research (e.g., chosen dark mode library, loading optimization technique).

---

**Next Steps**:
1. Execute Phase 0 research via Task agents
2. Consolidate findings in `research.md`
3. Re-run Constitution Check with resolved unknowns
4. Proceed to Phase 1 design (data models, quickstart)
5. Generate `tasks.md` via `/speckit.tasks` command (Phase 2)

**Estimated Timeline**:
- Phase 0 (Research): 2-4 hours
- Phase 1 (Design): 1-2 hours
- Phase 2 (Tasks): 30 minutes
- Total Planning: 3.5-6.5 hours before implementation begins
