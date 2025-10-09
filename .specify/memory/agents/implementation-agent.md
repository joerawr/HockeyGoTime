# HockeyGoTime Development Guidelines

Auto-generated from feature plan 001-hockey-go-time. Last updated: 2025-10-07

## Active Technologies

**Language/Version**: TypeScript (Next.js 15 with App Router, Node.js 20+ LTS)

**Primary Dependencies**:
- Next.js 15
- AI SDK 5 (with OpenAI provider)
- @modelcontextprotocol/sdk
- Google Maps Routes API v2
- Supabase client (Phase 2)

**AI Models**:
- GPT-5 for complex reasoning queries
- GPT-5-mini with 'low' effort setting for simple queries
- **PROHIBITED**: GPT-4o and GPT-4o-mini (proven to fail on complex schedule queries)

**External Services**:
- SCAHA MCP Server: https://scaha-mcp.vercel.app/api/mcp (StreamableHTTP transport)
- Google Maps Routes API v2: https://routes.googleapis.com/directions/v2:computeRoutes

## Project Structure

```
app/
├── hockey/                    # Main chat interface (TODO: move to root path)
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
│   │   └── scaha-client.ts  # SCAHA MCP singleton (StreamableHTTP)
│   └── CLAUDE.md            # MCP integration documentation
├── cache/                   # Caching abstractions
│   ├── memory-cache.ts     # Phase 1: In-memory Map-based cache
│   ├── supabase-cache.ts   # Phase 2: Supabase backend cache
│   ├── factory.ts          # Provider switching via env var
│   └── index.ts            # Singleton cache instances
├── travel/
│   ├── google-routes.ts    # Google Maps Routes API v2 client
│   └── time-calculator.ts  # Wake-up/departure time logic
├── storage/
│   └── preferences.ts      # localStorage wrapper for user preferences
└── validation/
    ├── date-time.ts        # Date/time validation utilities
    └── preferences.ts      # Preference validation and normalization

types/
├── preferences.ts          # User preference types
├── schedule.ts             # Schedule/game types
├── stats.ts                # Player/team stat types
├── travel.ts               # Travel calculation types
└── cache.ts                # Cache provider interface

specs/001-hockey-go-time/   # Feature specification and planning
├── spec.md                 # Feature requirements
├── plan.md                 # Implementation plan (this generated these guidelines)
├── research.md             # Technical research findings
├── data-model.md           # Entity definitions
├── quickstart.md           # Step-by-step implementation guide
├── contracts/              # API contracts
│   ├── google-routes-api.md
│   ├── scaha-mcp-tools.md
│   └── cache-provider.md
└── checklists/
    └── requirements.md     # Specification quality checklist
```

## Commands

**Development**:
```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build production app with Turbopack
pnpm start        # Start production server
```

**Type Checking** (NON-NEGOTIABLE quality gate):
```bash
pnpm tsc --noEmit  # MUST run before committing - zero errors required
```

**Package Management**:
- Use `pnpm` exclusively (NO npm or yarn)

## Code Style

### TypeScript
- **Strict Mode**: Mandatory, configured in `tsconfig.json`
- **No `any`**: Avoid except where truly unavoidable (document with inline comments)
- **Explicit Types**: Define interfaces/types in `types/` directory
- **Imports**: Use `@/` path alias for absolute imports

### React/Next.js
- **Server Components**: Default pattern, use Client Components only when needed
- **'use client' Directive**: Add to components using hooks, browser APIs, or event handlers
- **Streaming**: Use AI SDK's `streamText` for all AI responses
- **Error Boundaries**: Wrap async operations in try/catch, provide user-friendly errors

### MCP Integration
**Critical Lifecycle Pattern**:
```typescript
const client = await getScahaClient(); // Singleton pattern

const result = streamText({
  model: openai('gpt-5-mini'),
  messages,
  tools: await client.tools(),
  onFinish: async () => {
    await client.disconnect(); // Close AFTER streaming, not before!
  },
});
```

**Transport**: StreamableHTTP to remote Vercel server (NOT STDIO)

### Caching
**Two-Phase Strategy**:
- **Phase 1 (P1)**: In-memory cache (Map-based), fast development, immediate UX
- **Phase 2 (P2)**: Supabase backend cache, persistent, survives cold starts

**Usage Pattern**:
```typescript
import { scheduleCache } from '@/lib/cache';

const cacheKey = `schedule:${season}:${division}:${team}`;
const cached = await scheduleCache.get(cacheKey);

if (!cached) {
  const fresh = await getScheduleFromMCP();
  await scheduleCache.set(cacheKey, fresh, 24 * 60 * 60 * 1000); // 24hr TTL
}
```

### Google Routes API
**arrivalTime Pattern** (NOT departureTime):
```typescript
import { computeRoute } from '@/lib/travel/google-routes';

const gameDateTime = `${game.date}T${game.time}:00-07:00`; // ISO 8601 with timezone

const route = await computeRoute({
  originAddress: userPrefs.homeAddress,
  destinationAddress: venueAddress,
  arrivalTime: gameDateTime, // Traffic prediction at arrival time
});

const travelSeconds = parseInt(route.routes[0].duration.replace('s', ''), 10);
```

### Validation
- **User Preferences**: Validate and normalize in `lib/validation/preferences.ts`
- **Date/Time**: ISO 8601 format, timezone-aware, validate in `lib/validation/date-time.ts`
- **Addresses**: Geocode validation via Google Maps (implicit in Routes API)

## Performance Targets

**Constitution Requirements** (NON-NEGOTIABLE):
- <1s response for cached queries
- <3s response for 95th percentile uncached queries
- 100 concurrent users support
- 24-hour cache TTL

**Optimization Strategies**:
- Aggressive caching (schedules, stats, routes)
- Field masking in Google Routes API (reduce payload size)
- Singleton MCP client (avoid reconnection overhead)
- Server Components by default (reduce client bundle)

## Recent Changes

### Feature 001: Hockey Go Time - Travel Planning and Stats Enhancement (2025-10-07)

**Added**:
- User preferences with localStorage persistence (team, home address, prep time, arrival buffer)
- Travel time calculations using Google Maps Routes API v2 with traffic-aware routing
- Two-phase caching strategy (in-memory → Supabase)
- Player and team statistics via SCAHA MCP tools (pending verification)
- Venue address hardcoding in system prompt for Capstone demo

**Technical Decisions**:
- StreamableHTTP transport for SCAHA MCP (remote Vercel server)
- GPT-5/GPT-5-mini models exclusively (GPT-4o models prohibited)
- localStorage for user preferences (no authentication for Capstone MVP)
- In-memory cache first (Phase 1), Supabase migration later (Phase 2)
- Defer hotel recommendations to post-Capstone (low demo value)

**Capstone Constraints**:
- 2.5-week implementation timeline (deadline ~2025-10-25)
- Priority: P1 (user prefs, caching, routing fix) → P2 (travel planning, stats)
- Defer: P3+ (enhanced UI, PGHL support, hotel feature)

## Environment Variables

**Required**:
```bash
OPENAI_API_KEY=sk-...                     # OpenAI API key
SCAHA_MCP_URL=https://scaha-mcp.vercel.app/api/mcp  # SCAHA MCP server endpoint
GOOGLE_MAPS_API_KEY=...                   # Google Maps Routes API v2 key
```

**Optional (Phase 2)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co  # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...             # Supabase service role key
CACHE_PROVIDER=memory|supabase            # Cache provider selection (default: memory)
```

## Constitution Compliance

**Seven Principles** (from `.specify/memory/constitution.md` v2.0.4):

1. **User-Centric AI Experience**: Conversational, hockey-parent-friendly, normalizes informal input
2. **Type Safety & Quality Gates**: TypeScript strict mode, `pnpm tsc --noEmit` NON-NEGOTIABLE
3. **Performance First**: <1s cached, <3s uncached, 24hr TTL caching
4. **MCP Integration Correctness**: StreamableHTTP, singleton, close in `onFinish`
5. **Package Manager Discipline**: pnpm exclusively
6. **AI Model Selection**: GPT-5/GPT-5-mini only (NO GPT-4o)
7. **Deployment Ready**: Vercel env vars, automatic deployment from main branch

**Violations**: None permitted without constitution amendment.

## Known Issues & TODOs

**High Priority** (P1):
- [ ] Fix routing: Move app from `/hockey` to root path `/`
- [ ] Implement user preferences (localStorage)
- [ ] Implement in-memory cache

**Medium Priority** (P2):
- [ ] Integrate Google Routes API v2
- [ ] Implement travel time calculations
- [ ] Verify SCAHA MCP stats tools (`get_team_stats`, `get_player_stats`)
- [ ] Obtain venue list from user for hardcoded address mappings

**Low Priority** (P3+):
- [ ] Supabase cache migration (Phase 2)
- [ ] Update `lib/mcp/CLAUDE.md` to reflect StreamableHTTP as primary transport
- [ ] Implement donation button with A/B testing (P5)

**Deferred Post-Capstone**:
- [ ] Hotel recommendation feature
- [ ] LLM-based venue address deduplication pipeline
- [ ] PGHL multi-league support
- [ ] Enhanced team/venue information (photos, logos, maps)

## References

**Feature Documentation**:
- [Feature Specification](../../../specs/001-hockey-go-time/spec.md)
- [Implementation Plan](../../../specs/001-hockey-go-time/plan.md)
- [Technical Research](../../../specs/001-hockey-go-time/research.md)
- [Data Model](../../../specs/001-hockey-go-time/data-model.md)
- [Quickstart Guide](../../../specs/001-hockey-go-time/quickstart.md)

**API Contracts**:
- [Google Routes API](../../../specs/001-hockey-go-time/contracts/google-routes-api.md)
- [SCAHA MCP Tools](../../../specs/001-hockey-go-time/contracts/scaha-mcp-tools.md)
- [Cache Provider Interface](../../../specs/001-hockey-go-time/contracts/cache-provider.md)

**External Documentation**:
- [AI SDK MCP Integration](https://ai-sdk.dev/cookbook/node/mcp-tools)
- [Google Routes API](https://developers.google.com/maps/documentation/routes/overview)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific notes or overrides here -->
<!-- MANUAL ADDITIONS END -->
