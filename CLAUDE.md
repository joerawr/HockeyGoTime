# CLAUDE.md

This file provides guidance when working with code in this repository.

## Project Overview

**HockeyGoTime (HGT)** is a conversational AI assistant for SCAHA (Southern California Amateur Hockey Association) youth hockey schedules. Parents and players can ask natural language questions about game times, opponents, venues, and more.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production app with Turbopack
- `pnpm start` - Start production server
- `pnpm tsc --noEmit` - Run TypeScript compiler to check for type errors
- `pnpm tsx scripts/import-venues.ts <csv-file>` - Import venues to Supabase database

## Code Quality

**IMPORTANT**: Always run `pnpm tsc --noEmit` after writing or modifying any code to ensure there are no TypeScript errors before considering the task complete.

## Package Manager

This project strictly uses **pnpm**. Do not use npm or yarn.

## Architecture

### Core Stack
- **Next.js 15** with App Router
- **AI SDK 5** with OpenAI GPT-4o integration
- **MCP (Model Context Protocol)** for SCAHA schedule data
- **shadcn/ui** components (New York style, neutral base color)
- **Tailwind CSS v4** for styling

### Key Directories
- `app/hockey/` - HockeyGoTime chat interface (main feature)
- `app/api/hockey-chat/` - AI chat endpoint with SCAHA MCP integration
- `lib/mcp/client/` - MCP client implementations (Firecrawl, SCAHA)
- `components/agent/` - System prompts and AI instructions
- `components/ui/` - shadcn/ui components
- `components/ai-elements/` - AI chat UI components

### SCAHA MCP Integration

The app connects to a local SCAHA MCP server via **StreamableHTTP transport**:

**MCP Client**: `lib/mcp/client/scaha-client.ts`
- Uses `StreamableHTTPClientTransport` to spawn SCAHA server process
- Singleton pattern for connection reuse
- Exposes `get_schedule` tool (MVP - more tools coming)

**API Route**: `app/api/hockey-chat/route.ts`
- Connects to SCAHA MCP client
- Retrieves tools via `client.tools()`
- Streams responses with tool calling
- Closes client on `onFinish` to prevent errors

**System Prompt**: `components/agent/hockey-prompt.ts`
- Normalizes user input ("14B" → "14U B")
- Handles team variations ("Jr Kings 1" → "Jr. Kings (1)")
- Defaults to 2025/2026 season
- Hockey-parent-friendly tone

### PGHL MCP Integration

The app can also connect to the hosted PGHL MCP server via **StreamableHTTP**:

- **MCP Client**: `lib/mcp/client/pghl-client.ts`
  - Uses the production HTTP endpoint (`PGHL_MCP_URL`, defaults to `https://pghl-mcp.vercel.app/api/mcp`)
  - Exposes `list_schedule_options` and `get_schedule`
  - Shares the same singleton pattern as the SCAHA client
- **System Prompt**: `components/agent/pghl-prompt.ts`
  - Tailored for PGHL naming and season defaults (e.g., "2025-26")
  - Encourages use of the progressive discovery tool
  - Notes that venue travel times may require manual addresses

### Data Flow

```
User: "Who does the 14B Jr Kings play on Oct 5?"
  ↓
Chat UI (React) → /api/hockey-chat
  ↓
AI SDK streamText + MCP tools
  ↓
get_schedule({ season: "2025/2026", division: "14U B", team: "jr-kings-1", date: "2025-10-05" })
  ↓
SCAHA MCP Server (StreamableHTTP) → scrapes scaha.net
  ↓
Returns: { games: [{ home, away, time, venue, rink, ... }] }
  ↓
AI formats response: "On Sunday, Oct 5th at 7:00 AM, Jr. Kings (1) play OC Hockey (1)..."
```

### Environment Variables

Create `.env.local` with:
```bash
OPENAI_API_KEY=sk-...your-key-here...
SCAHA_MCP_SERVER_PATH=../scaha.net-mcp/dist/server.js  # Optional, defaults to this
```

### User Preferences (Optional Feature)

**Important**: User preferences are **OPTIONAL** and not enforced. Users can:
1. Save preferences (team, division, season, home address) for convenience
2. Always specify team/division explicitly in each query
3. Mix both approaches

The preferences panel now includes a **League Data Source** dropdown (SCAHA vs PGHL). Changing the selection saves to localStorage and refreshes the page so the chat session reconnects to the appropriate MCP server.

The preference panel includes:
- "Edit" button to update preferences
- "Clear All" button (useful for families with multiple players)
- localStorage-based persistence (client-side only, no authentication)

**Never prompt users to set preferences** unless they use "we/our team" without having preferences saved.

### MVP Scope

**Currently Working:**
- ✅ Schedule queries (get_schedule tool)
- ✅ Natural language input normalization
- ✅ Home/away and jersey info
- ✅ Venue and rink details
- ✅ User preferences (optional, localStorage-based)
- ✅ In-memory caching (24-hour TTL)
- ✅ Team name flexibility (handles inconsistent "(1)" suffix in SCAHA data)

**Post-MVP:**
- Travel time calculator with Google Routes API (Phase 6)
- Team standings (get_team_stats - Phase 7)
- Player stats (get_player_stats - Phase 7)
- Supabase persistent caching (Phase 8)
- Hotel suggestions (deferred post-Capstone)

## Venue Database Management

HockeyGoTime uses **Supabase** to store venue addresses and aliases for travel time calculations. The venue resolver maps schedule venue names to physical addresses via:
- **Canonical names** - Official venue names (e.g., "Skating Edge Harbor City")
- **Aliases** - Alternate names from schedules (e.g., "Skating Edge", "Bay Harbor", "Harbor City")
- **Google Place IDs** - For Maps API integration

### Adding New Venues

**1. Create CSV with venue data:**

```csv
canonical_name,address,place_id,aliases
Skating Edge Harbor City,"23770 S Western Ave, Harbor City, CA 90710",ChIJxcJI8YZK3YARJohntQW-P9I,Skating Edge|Bay Harbor|Harbor City
UTC La Jolla Ice,"4545 La Jolla Village Dr, San Diego, CA 92122",ChIJb9dF1tIA3IARkt0i1FstGVs,UTC|UTC Ice|La Jolla|La Jolla Ice
```

**CSV Format:**
- `canonical_name` - Official venue name (required, unique)
- `address` - Full address for Google Maps (required)
- `place_id` - Google Maps Place ID starting with "ChIJ" (required)
- `aliases` - Pipe-separated alternate names (optional)

**2. Get Google Place IDs:**
- Go to [Google Place Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
- Search for venue address
- Copy Place ID (starts with `ChIJ...`)

**3. Import to Supabase:**

```bash
pnpm tsx scripts/import-venues.ts data/my-venues.csv
```

**Output:**
```
📥 Importing venues from data/my-venues.csv...
Found 2 venues to import
✅ Imported Skating Edge Harbor City (3 aliases)
✅ Imported UTC La Jolla Ice (7 aliases)

📊 Import Summary:
   Venues imported: 2
   Aliases imported: 10
```

### Refreshing Venue Cache

The app caches venues in-memory on startup. After adding/updating venues in Supabase, refresh the cache:

```bash
# Development
curl -X POST http://localhost:3000/api/venue/refresh-cache

# Production
curl -X POST https://hockeygotime.net/api/venue/refresh-cache
```

**Response:**
```json
{
  "success": true,
  "refreshed_at": "2025-10-16T20:00:00.000Z",
  "message": "Cache refreshed successfully. Check console logs for venue/alias counts."
}
```

**When to refresh:**
- After importing new venues via CSV
- After manually adding venues via Supabase SQL editor
- After updating venue aliases
- **Not needed** after server restart (auto-loads on startup)

### Venue Resolution Flow

```
Schedule says: "Skating Edge Harbor City"
  ↓
Venue Resolver (lib/venue/resolver.ts)
  ↓
Checks in-memory cache for:
  1. Exact canonical name match
  2. Alias match (case-insensitive, fuzzy)
  ↓
Returns: { canonical_name, address, place_id }
  ↓
Travel Time Calculator uses address + place_id
```

### Database Schema

**venues table:**
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  place_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**venue_aliases table:**
```sql
CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, alias_text)
);
```

### Key Files

- `scripts/import-venues.ts` - CSV import script
- `lib/venue/resolver.ts` - Venue name → address resolution
- `lib/venue/cache.ts` - In-memory caching layer
- `lib/venue/client.ts` - Supabase client
- `app/api/venue/refresh-cache/route.ts` - Cache refresh endpoint

## Important Implementation Notes

### MCP Client Lifecycle

**Critical**: Must close MCP client AFTER streaming completes:

```typescript
const result = streamText({
  // ...
  onFinish: async () => {
    await schahaClient.disconnect(); // Close here, not before!
  },
});
```

Closing too early causes "closed client" errors during tool execution.

### Input Normalization

The AI automatically handles:
- "14B" → "14U B Regular Season"
- "Jr Kings 1" → "Jr. Kings (1)"
- "this Sunday" → calculates actual date
- Defaults to 2025/2026 season

See `components/agent/hockey-prompt.ts` for complete rules.

### StreamableHTTP vs SSE Transport

- **SCAHA**: Uses `StreamableHTTPClientTransport` (local server, spawns process)
- **Firecrawl**: Uses `SSEClientTransport` (remote server, HTTP SSE)

Different transports for different use cases.

## Adding Components

- shadcn/ui: `pnpm dlx shadcn@latest add [component-name]`
- AI Elements: Already included in starter

## Related Projects

- [scaha.net-mcp](https://github.com/joerawr/scaha.net-mcp) - SCAHA MCP server (must be built and available)
- [typescript-next-starter](https://github.com/AgentEngineer-ing/typescript-next-starter) - Base template

## GitHub Issue Pattern

When creating GitHub issues for this repository, use the following format:

```
## Problem
[Clear problem statement]

## Solution
[Proposed fix or approach]

## Rabbit holes
[One line or short list of things or topics to avoid]

## No gos
[Things that should not be done, e.g., "Changing SDKs or anything that would trigger a 2.0.0 version"]
```
