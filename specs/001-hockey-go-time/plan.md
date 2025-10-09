# Implementation Plan: Hockey Go Time - Travel Planning and Stats Enhancement

**Branch**: `001-hockey-go-time` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-hockey-go-time/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

HockeyGoTime is an AI-powered conversational interface for SCAHA youth hockey schedules with travel planning capabilities. This feature enhances the existing schedule query functionality by adding: (1) user preferences with localStorage persistence, (2) travel time calculations using Google Maps Routes API v2 with traffic-aware routing, (3) performance optimization through two-phase caching (in-memory → Supabase), and (4) player/team statistics via SCAHA MCP tools. The implementation prioritizes Capstone demo value with a 2.5-week delivery timeline, focusing on P1 (user preferences, in-memory caching) and P2 (travel planning, stats, Supabase caching) features.

## Technical Context

**Language/Version**: TypeScript (Next.js 15 with App Router, Node.js 20+ LTS)
**Primary Dependencies**: Next.js 15, AI SDK 5, @modelcontextprotocol/sdk, Google Maps Routes API v2, Supabase client (Phase 2)
**Storage**: Phase 1 - In-memory cache (Map-based); Phase 2 - Supabase server-side cache (24hr TTL); Client - localStorage (user preferences)
**Testing**: TypeScript strict mode type checking (`pnpm tsc --noEmit` - NON-NEGOTIABLE quality gate)
**Target Platform**: Vercel serverless (Next.js App Router with Server Components, automatic deployment from main branch)
**Project Type**: Web application (Next.js App Router with AI SDK streaming)
**Performance Goals**: <1s response for cached queries, <3s for 95th percentile uncached queries, 100 concurrent users, 24-hour cache TTL
**Constraints**: Capstone deadline 2025-10-25 (2.5 weeks), GPT-5/GPT-5-mini only (NO GPT-4o models), pnpm package manager exclusively, StreamableHTTP transport for MCP
**Scale/Scope**: SCAHA youth hockey parents (~1000 users target), conversational AI interface, 8 user stories (P1-P5), 46 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` principles:

- [x] **I. User-Centric AI Experience**: Yes - spec emphasizes conversational natural language ("we", "our team"), defaults to current season, normalizes informal input ("14B" → "14U B")
- [x] **II. Type Safety & Quality Gates**: Yes - TypeScript strict mode documented in Technical Context, `pnpm tsc --noEmit` defined as NON-NEGOTIABLE quality gate
- [x] **III. Performance First**: Yes - <1s cached, <3s uncached targets defined, two-phase caching strategy documented (in-memory P1, Supabase 24hr TTL P2)
- [x] **IV. MCP Integration Correctness**: Yes - StreamableHTTP transport to https://scaha-mcp.vercel.app/api/mcp, singleton pattern for client reuse, close in `onFinish` callback
- [x] **V. Package Manager Discipline**: Yes - pnpm exclusively documented in Technical Context constraints
- [x] **VI. AI Model Selection**: Yes - GPT-5/GPT-5-mini specified in Technical Context, GPT-4o models explicitly prohibited (proven to fail on complex schedule queries)
- [x] **VII. Deployment Ready**: Yes - Vercel deployment documented, `SCAHA_MCP_URL` environment variable configured, `GOOGLE_MAPS_API_KEY` required for Routes API v2

**Violations Requiring Justification**: None - all principles satisfied

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── hockey/                    # Main chat interface (to be moved to root path)
│   ├── page.tsx              # Chat UI with preference panels
│   └── layout.tsx            # Hockey-specific layout
├── api/
│   ├── hockey-chat/          # AI streaming endpoint
│   │   └── route.ts         # MCP integration, tool calling, streamText
│   └── cache/               # Cache management endpoints (Phase 2)
│       ├── schedule/        # Schedule cache CRUD
│       └── stats/           # Stats cache CRUD

components/
├── agent/
│   └── hockey-prompt.ts     # System prompt with venue hardcoding, input normalization
├── ui/                      # shadcn/ui components
│   ├── chat/               # Chat-related UI
│   └── preferences/        # User preference forms/panels
└── ai-elements/            # AI SDK chat components

lib/
├── mcp/
│   ├── client/
│   │   ├── scaha-client.ts    # SCAHA MCP singleton (StreamableHTTP)
│   │   └── scaha-client.ts:22 # SCAHA_MCP_URL configuration
│   └── CLAUDE.md              # MCP integration documentation
├── cache/                     # Caching abstractions
│   ├── memory-cache.ts       # Phase 1: In-memory Map-based cache
│   └── supabase-cache.ts     # Phase 2: Supabase backend cache
├── travel/
│   ├── google-routes.ts      # Google Maps Routes API v2 client
│   └── time-calculator.ts    # Wake-up/departure time logic
└── storage/
    └── preferences.ts        # localStorage wrapper for user preferences

types/
├── preferences.ts           # User preference types
├── schedule.ts              # Schedule/game types
├── stats.ts                 # Player/team stat types
└── travel.ts                # Travel calculation types
```

**Structure Decision**: Next.js 15 App Router web application. All AI chat functionality in `app/hockey/` (to be moved to root path per constitution TODO). MCP integration via `lib/mcp/client/` with StreamableHTTP transport. Two-phase caching strategy: in-memory (`lib/cache/memory-cache.ts`) for P1, Supabase (`lib/cache/supabase-cache.ts`) for P2. localStorage-based user preferences (no authentication). Server components by default, client components only for interactive UI.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
