# HockeyGoTime 🏒

Conversational AI assistant for SCAHA (Southern California Amateur Hockey Association) youth hockey schedules. Ask questions in natural language about game times, opponents, locations, and more!

## Features

- 🗓️ **Schedule Queries**: "Who does the 14B Jr Kings play on October 5th?"
- ⏰ **Game Times**: "What time is the game this Sunday?"
- 🏟️ **Venue Info**: "Where is the 14A Red Wings game on 10/12?"
- 👕 **Jersey Info**: "Are we home or away this weekend?"
- 🤖 **Natural Language**: Handles variations like "14B" → "14U B", "Jr Kings 1" → "Jr. Kings (1)"

## Tech Stack

- **Next.js 15** with App Router
- **AI SDK 5** with OpenAI GPT-4o
- **MCP (Model Context Protocol)** for SCAHA schedule data
- **shadcn/ui** components
- **Tailwind CSS v4**
- **TypeScript** strict mode

## Prerequisites

1. **Node.js** 20+ and **pnpm** installed
2. **OpenAI API Key** (get one at https://platform.openai.com)
3. **SCAHA MCP Server** running locally (see [scaha.net-mcp](https://github.com/joerawr/scaha.net-mcp))

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/HockeyGoTime.git
cd HockeyGoTime
pnpm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-...your-key-here...
SCAHA_MCP_SERVER_PATH=../scaha.net-mcp/dist/server.js
```

### 3. Build SCAHA MCP Server

If you haven't already, set up the SCAHA MCP server:

```bash
cd ../scaha.net-mcp
pnpm install
pnpm build
cd ../HockeyGoTime
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click "HockeyGoTime - SCAHA Schedule Assistant".

## Usage Examples

Try these queries in the chat:

**Basic Schedule Queries:**
- "Who does the 14B Jr Ducks play on October 5th?"
- "What time is the 12A Stars game this Sunday?"
- "Show me all games for the 16AAA Jr Kings in November"

**Home/Away & Jersey:**
- "Are we home or away this weekend?"
- "What jersey do we wear on Sunday?"
- "Is the October 12th game home or away?"

**Venue & Location:**
- "Where is the 14B Jr Kings game on 10/5?"
- "What rink are we playing at this Sunday?"

**The AI automatically handles:**
- ✅ "14B" → "14U B Regular Season"
- ✅ "Jr Kings" → "Jr. Kings (1)" (or asks which team if ambiguous)
- ✅ "this Sunday" → calculates next Sunday's date
- ✅ Defaults to 2025/2026 season

## Architecture

```
User Query
    ↓
Next.js Chat UI (React)
    ↓
/api/hockey-chat (AI SDK 5)
    ↓
OpenAI GPT-4o + SCAHA MCP Tools
    ↓
SCAHA MCP Server (STDIO)
    ↓
scaha.net (scraping)
    ↓
Returns: Games, times, venues
```

### Key Files

- `/app/hockey/page.tsx` - Chat UI
- `/app/api/hockey-chat/route.ts` - API endpoint with MCP integration
- `/lib/mcp/client/scaha-client.ts` - SCAHA MCP client (STDIO transport)
- `/components/agent/hockey-prompt.ts` - System prompt with normalization rules

## Development

### Type Checking

```bash
pnpm tsc --noEmit
```

### Build for Production

```bash
pnpm build --turbopack
pnpm start
```

### Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production app
- `pnpm start` - Start production server

## How It Works

### Input Normalization

The AI automatically normalizes user input:

| User Says | AI Interprets |
|-----------|---------------|
| "14B Jr Kings" | "14U B Regular Season, Jr. Kings (1)" |
| "this Sunday" | "2025-10-06" (calculates date) |
| "Jr Kings1" | "Jr. Kings (1)" |
| "2025" | "2025/2026 season" |

### MCP Integration

The app uses **STDIO transport** to connect to the local SCAHA MCP server:

1. User asks question
2. AI calls `get_schedule` MCP tool with normalized params
3. SCAHA server scrapes scaha.net
4. Returns game data (opponent, time, venue, rink)
5. AI formats response conversationally

### System Prompt

The AI has detailed instructions for:
- Normalizing age groups ("14B" → "14U B")
- Handling team variations
- Formatting times (12-hour format)
- Including jersey color (home/away)
- Being friendly and hockey-parent-friendly

## MVP Scope

**Current (MVP):**
✅ Schedule queries via `get_schedule` tool
✅ Natural language understanding
✅ Home/away and jersey info
✅ Venue and rink details

**Future (Post-MVP):**
- Team standings (`get_team_stats`)
- Player statistics (`get_player_stats`)
- Travel time calculator (Google Routes API)
- Hotel suggestions for early games
- Calendar export

## Troubleshooting

### "Failed to connect to SCAHA MCP server"

- Check that `SCAHA_MCP_SERVER_PATH` in `.env.local` points to the built server
- Ensure the SCAHA MCP server has been built: `cd ../scaha.net-mcp && pnpm build`
- Check the path is correct: `ls -la ../scaha.net-mcp/dist/server.js`

### "OPENAI_API_KEY not found"

- Make sure `.env.local` exists and contains your API key
- Restart the dev server after adding the key

### TypeScript errors

```bash
pnpm tsc --noEmit
```

Check for any type errors. The project uses strict mode.

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `pnpm tsc --noEmit` to check types
5. Submit a PR

## License

MIT

## Related Projects

- [scaha.net-mcp](https://github.com/joerawr/scaha.net-mcp) - SCAHA MCP server
- [typescript-next-starter](https://github.com/AgentEngineer-ing/typescript-next-starter) - Base template

---

Built with ❤️ for SCAHA hockey families
