# CLAUDE.md

This file provides guidance when working with code in this repository.

## Project Overview

**HockeyGoTime** is a conversational AI assistant for SCAHA (Southern California Amateur Hockey Association) youth hockey schedules. Parents and players can ask natural language questions about game times, opponents, venues, and more.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production app with Turbopack
- `pnpm start` - Start production server
- `pnpm tsc --noEmit` - Run TypeScript compiler to check for type errors

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

The app connects to a local SCAHA MCP server via **STDIO transport**:

**MCP Client**: `lib/mcp/client/scaha-client.ts`
- Uses `StdioClientTransport` to spawn SCAHA server process
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
SCAHA MCP Server (STDIO) → scrapes scaha.net
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

### MVP Scope

**Currently Working:**
- ✅ Schedule queries (get_schedule tool)
- ✅ Natural language input normalization
- ✅ Home/away and jersey info
- ✅ Venue and rink details

**Post-MVP:**
- Team standings (get_team_stats - not yet implemented in SCAHA MCP)
- Player stats (get_player_stats - not yet implemented in SCAHA MCP)
- Travel time calculator with Google Routes API
- Hotel suggestions

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

### STDIO vs SSE Transport

- **SCAHA**: Uses `StdioClientTransport` (local server, spawns process)
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
