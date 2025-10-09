# HockeyGoTime — Conversational Hockey Schedule Assistant — Functional Requirements Document (FRD)

## 1) Purpose
An AI-powered chat interface that enables parents and youth hockey players to ask natural language questions about their SCAHA hockey schedules, game times, opponents, and travel logistics. The system computes wake-up times, departure times, and provides hotel suggestions when needed.

## 2) Scope / Actors
- **Actors**: Parents ("Dad") or Hockey players ("Child")
- **System**: Chat interface powered by Next.js 15 + AI SDK 5, connected to:
  - **SCAHA MCP Server** (self-hosted StreamableHTTP): Provides schedule, team stats, and player stats from scaha.net
  - **Google Routes API**: Travel time and departure recommendations
  - **Perplexity Search MCP**: For searching latest documentation during development

## 3) Core Architecture

### Chat Interface (TypeScript Next.js Starter)
- **Framework**: Next.js 15 with App Router
- **AI Integration**: AI SDK 5 with OpenAI GPT-5
- **UI Components**: shadcn/ui (New York style, neutral base color)
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm (strictly enforced)

### MCP Server Integration
The chat interface connects to MCP servers configured in `.mcp.json`:
```json
{
  "mcpServers": {
    "scaha-schedule": {
      "command": "node",
      "args": ["path/to/scaha-mcp-server/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### SCAHA MCP Server Tools (StreamableHTTP Transport)
The self-hosted SCAHA MCP server provides 4 tools:

1. **get_schedule**
   - Params: `{ season, division?, team_slug?, date_range? }`
   - Returns: Array of games with game_id, date, time, home, away, venue, rink, status, scores
   - Example: Get all games for "Jr. Ducks (1)" in October 2025

2. **get_team_stats**
   - Params: `{ season, division, team_slug }`
   - Returns: Team standings (gp, w, l, t, points, gf, ga, gd)

3. **get_player_stats**
   - Params: `{ season, division, team_slug, player: { name?, number? } }`
   - Returns: Player stats (number, name, gp, g, a, pts, pims)

4. **get_schedule_csv**
   - Params: `{ season, division?, team_slug? }`
   - Returns: Raw CSV file (base64 encoded) from scaha.net

## 4) User Input Normalization

### Division/Age Group Handling
Users speak naturally, so the system normalizes inputs:
- User says: **"14B"** → System interprets: **"14U B Regular Season"**
- User says: **"12A"** → System interprets: **"12U A Regular Season"**
- The "U" (Under) is implied and added automatically
- Assumes "Regular Schedule" unless "Playoffs" or "Tournament" specified

### Team Selection
For teams with multiple squads (e.g., "Jr. Kings (1)", "Jr. Kings (2)", "Jr. Kings (3)"):
- Accepts variations: "Jr Kings 1", "Jr Kings1", "JR Kings (1)"
- If ambiguous, prompt: "I see 3 Jr Kings teams. Which one are you asking about?"

### Season Handling
- Assumes **2025/2026** season unless otherwise specified
- Accepts: "2025-2026", "25/26", "this season"

### Date References
- "this Sunday" → next occurring Sunday
- "October 5th" → October 5, 2025 (current season)
- "this weekend" → upcoming Saturday/Sunday
- "next weekend" → following Saturday/Sunday

## 5) Data Sources & APIs
- **SCAHA Schedule Data**: Accessed via MCP server (scrapes scaha.net, parses CSV exports)
- **Team/Venue Directory**: Mapping table (venue name → postal address)
- **Google Routes API**: Travel duration and recommended departure times for arrival deadlines
- **Perplexity Search**: Documentation lookup during development (not user-facing)

## 6) Conversational Workflow

### User Query → AI Response Flow
1. **User asks natural language question** via chat interface
   - Example: "Who does the 14B Jr Kings play on October 5th?"

2. **AI processes query and normalizes parameters**:
   - Division: "14B" → "14U B"
   - Team: "Jr Kings" → "Jr. Kings (1)" (or prompt for clarification)
   - Date: "October 5th" → "2025-10-05"
   - Season: defaults to "2025/2026"

3. **AI calls SCAHA MCP Server tool** (`get_schedule`):
   ```typescript
   {
     season: "2025/2026",
     division: "14U B",
     team_slug: "jr-kings-1",
     date_range: { start: "2025-10-05", end: "2025-10-05" }
   }
   ```

4. **MCP Server returns schedule data**:
   ```json
   [{
     "game_id": "149151748",
     "date": "2025-10-05",
     "time": "07:00:00",
     "home": "Jr. Kings (1)",
     "away": "OC Hockey (1)",
     "venue": "Great Park Ice & Fivepoint Arena",
     "rink": "1",
     "status": "Scheduled"
   }]
   ```

5. **AI formats conversational response**:
   > "On October 5th, the Jr. Kings (1) play against OC Hockey (1) at 7:00 AM at Great Park Ice & Fivepoint Arena (Rink 1). It's a home game."

### Travel Time Calculation Workflow (When Requested)
When user asks about travel/wake times:

1. **User provides context**:
   - "When do we need to leave for the 14B Jr Kings game on October 5th?"
   - User preferences stored in session/profile:
     - `start_address`: "123 Main St, Irvine, CA"
     - `get_ready_minutes`: 45
     - `before_game_minutes`: 60
     - `min_wake_time`: "6:00 AM"

2. **Get game details** (via MCP as above)

3. **Resolve venue address**:
   - Lookup: "Great Park Ice & Fivepoint Arena" → "888 Ridge Valley, Irvine, CA 92618"
   - If not found: geocode and cache for future queries

4. **Convert game time to UTC**:
   - `game_time_local`: 7:00 AM PT (America/Los_Angeles)
   - `game_time_utc`: 14:00 UTC (handle DST)

5. **Calculate desired arrival**:
   - `desired_arrival_utc = game_time_utc - before_game_minutes`
   - Example: 14:00 - 60min = 13:00 UTC (6:00 AM PT)

6. **Call Google Routes API**:
   ```typescript
   {
     origin: "123 Main St, Irvine, CA",
     destination: "888 Ridge Valley, Irvine, CA 92618",
     arrival_time: "2025-10-05T13:00:00Z",
     traffic_model: "best_guess"
   }
   ```
   Returns: `{ duration: "25 minutes", departure_time: "2025-10-05T12:35:00Z" }`

7. **Calculate wake time**:
   - `leave_time_local`: 5:35 AM PT
   - `wake_time_local = leave_time_local - get_ready_minutes`
   - Example: 5:35 AM - 45min = 4:50 AM PT

8. **Check hotel logic**:
   - If `wake_time_local` < `min_wake_time` (4:50 AM < 6:00 AM):
     - Trigger hotel suggestion workflow
     - Generate Google Maps hotel search link near venue

9. **AI responds conversationally**:
   > "For the October 5th game at 7:00 AM, here's your schedule:
   >
   > ⏰ **Wake up**: 4:50 AM
   > 🚗 **Leave home**: 5:35 AM
   > 🏒 **Arrive at rink**: 6:00 AM (60 min early)
   > 🛣️ **Drive time**: ~25 minutes
   >
   > ⚠️ That's earlier than your preferred 6:00 AM wake time. You might want to [search for hotels](https://maps.google.com/...) near the arena."

## 7) Business Rules & Data Handling

### Jersey Logic
- **Home games**: Home team wears primary jersey (typically dark)
- **Away games**: Away team wears white/light jersey
- Always remind: "Bring both jerseys to be safe"

### Time Zone & DST Handling
- All times from SCAHA are in **America/Los_Angeles** (Pacific Time)
- Store both `_local` and `_utc` timestamps
- Use `date-fns-tz` for DST-aware conversions
- Display times in user's local timezone (assume PT for SCAHA)

### Venue Address Resolution
- Maintain persistent lookup table: `venue_name → address`
- On cache miss: geocode via Google Maps Geocoding API, then store
- Sample mappings:
  ```typescript
  {
    "Great Park Ice & Fivepoint Arena": "888 Ridge Valley, Irvine, CA 92618",
    "Aliso Viejo Ice": "27741 La Paz Rd, Aliso Viejo, CA 92656",
    "Anaheim ICE": "300 W Lincoln Ave, Anaheim, CA 92805"
    // ... more venues
  }
  ```

### Team Name Normalization
- Strip extra spaces, normalize case
- Handle numbered squads: "Jr. Ducks (1)" vs "Jr Ducks 1"
- Maintain mapping of common variations → canonical names

### Error Handling
- **Schedule not found**: "I couldn't find a game for [team] on [date]. Let me check the full schedule..."
- **Venue not found**: "I don't have the address for [venue]. Can you provide it?"
- **Routes API failure**: Retry once, then use estimated drive time (distance / 35mph avg)
- **Ambiguous team**: "I see multiple teams named [team]. Please specify (1), (2), or (3)."

## 8) MVP User Interactions

The MVP focuses on **conversational schedule queries** using the SCAHA MCP server.

### Supported Questions (Priority 1 - MVP)
These work entirely via SCAHA MCP server without needing Google Routes API:

1. **Schedule Queries**:
   - "Who does the 14B Jr Kings play on October 5th?"
   - "What time is the 14A Red Wings game this Sunday?"
   - "When does the 12B Stars play next?"
   - "Show me all games for the 14B Jr Ducks in October"

2. **Opponent Queries**:
   - "Who are we playing this weekend?" (requires context: which team?)
   - "Who are the 14B Jr Kings playing this weekend?"

3. **Jersey/Home-Away**:
   - "Are we home or away this weekend?"
   - "What jersey for this Sunday?"
   - "Do we wear white or dark this weekend?"

4. **Game Location**:
   - "Where is the 14B Jr Kings game on October 5th?"
   - "What rink are we playing at this Sunday?"

### Future Features (Post-MVP)
These require Google Routes API and user preferences:

5. **Travel Time Queries**:
   - "When do we need to leave for this Sunday's game?"
   - "What time do I need to wake up for the game on October 5th?"

6. **Hotel Queries**:
   - "For a min wake time of 6am, which games need a hotel?"
   - "Do we need a hotel for this weekend's game?"

7. **Multi-game Analysis**:
   - "Which games this month require leaving before 6am?"
   - "Show me all away games more than 2 hours away"

## 9) Conversational Response Format

Responses should be natural, concise, and hockey-parent-friendly:

### Example 1: Simple Schedule Query
**User**: "Who does the 14B Jr Kings play on October 5th?"

**AI Response**:
> On **Sunday, October 5th at 7:00 AM**, the Jr. Kings (1) play against **OC Hockey (1)** at Great Park Ice & Fivepoint Arena (Rink 1). It's a **home game**, so wear your dark jersey. 🏒

### Example 2: Weekend Games
**User**: "What games does the 14B Jr Ducks have this weekend?"

**AI Response**:
> The Jr. Ducks (1) have one game this weekend:
>
> **Saturday, Oct 12 at 8:40 AM**
> vs. Jr. Ducks (2) (Home)
> Great Park Ice, Rink 1
> Jersey: Dark 🏒

### Example 3: Travel Time (Post-MVP)
**User**: "When do we need to leave for the October 5th game?"

**AI Response**:
> For the **Oct 5th game at 7:00 AM** (Great Park Ice):
>
> ⏰ **Wake up**: 4:50 AM
> 🚗 **Leave home**: 5:35 AM
> 🏒 **Arrive**: 6:00 AM (60 min early)
> 🛣️ **Drive**: ~25 minutes
>
> ⚠️ That's earlier than your usual 6:00 AM wake time. Consider staying nearby the night before. [Search hotels →](https://maps.google.com/...)

## 10) System Prompt for AI Agent

The chat interface includes this system prompt to guide the AI's behavior:

```
You are HockeyGoTime, a helpful assistant for Southern California youth hockey families.

IMPORTANT INPUT NORMALIZATION:
- When users say "14B", "14A", "12B", etc., interpret as "14U B", "14U A", "12U B" - the "U" (Under) is implied
- Assume "Regular Season" unless playoffs/tournament specified
- Default to 2025/2026 season unless otherwise stated
- For teams with multiple squads (e.g., "Jr. Kings (1)", "Jr. Kings (2)"):
  - Accept variations: "Jr Kings 1", "Jr Kings1", "JR Kings (1)"
  - If ambiguous, ask: "I see [N] [team] teams. Which one: (1), (2), or (3)?"

DATE HANDLING:
- "this Sunday" → next occurring Sunday in current season
- "October 5" or "10/5" → October 5, 2025
- "this weekend" → upcoming Sat/Sun
- "next weekend" → following Sat/Sun

RESPONSE STYLE:
- Be conversational and hockey-parent-friendly
- Use emojis sparingly (🏒 ⏰ 🚗 for relevant contexts)
- Always specify home/away and jersey color
- Include venue name AND rink number (e.g., "Great Park Ice, Rink 1")
- Use 12-hour time format (e.g., "7:00 AM", not "07:00")

TOOLS AVAILABLE:
- get_schedule: Get game schedules by team/date
- get_team_stats: Get team standings
- get_player_stats: Get individual player stats
- get_schedule_csv: Download full season CSV

When you don't have enough context (which team?), politely ask the user to clarify.
```

## 11) Technical Implementation Details

### MCP Client Integration (Next.js Chat App)
Based on the typescript-next-starter template:

**File Structure**:
```
/app/api/chat/route.ts          # AI chat endpoint (AI SDK 5)
/app/page.tsx                   # Chat UI with PromptInput component
/components/ai-elements/        # Conversation, Message components
/lib/mcp-client.ts             # MCP client initialization
/.mcp.json                     # MCP server configuration
```

**MCP Client Setup** (`lib/mcp-client.ts`):
```typescript
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/StreamableHTTP.js';

export async function getScahaMCPClient() {
  const mcpClient = await createMCPClient({
    transport: new StreamableHTTPClientTransport({
      command: 'node',
      args: ['/path/to/scaha-mcp-server/dist/server.js'],
    }),
  });

  return mcpClient;
}
```

**Chat API Route** (`app/api/chat/route.ts`):
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getScahaMCPClient } from '@/lib/mcp-client';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const mcpClient = await getScahaMCPClient();
  const tools = await mcpClient.tools();

  const result = await generateText({
    model: openai('gpt-4o'),
    messages,
    tools,
    system: `[System prompt from section 10]`,
  });

  await mcpClient.close();

  return Response.json({ response: result.text });
}
```

### Environment Variables Required
```env
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=...  # For future Routes API integration
```

### Dependencies (package.json)
```json
{
  "dependencies": {
    "ai": "^5.0.0",
    "@ai-sdk/openai": "latest",
    "@modelcontextprotocol/sdk": "latest",
    "next": "15.x",
    "react": "^19.0.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^3.0.0"
  }
}
```

## 12) Non-Functional Requirements

### Performance
- Chat response time: < 3 seconds for schedule queries
- MCP tool calls: < 2 seconds (scraping scaha.net)
- Support concurrent users (Vercel serverless deployment)

### Reliability
- **Time zone correctness is critical** - all PT/UTC conversions must account for DST
- Idempotent venue address caching (never geocode same venue twice)
- Graceful degradation if SCAHA site changes format

### Security
- No user authentication required for MVP (public schedules)
- Rate limiting on API routes to prevent abuse
- Validate all user inputs before passing to tools

### Maintainability
- Type-safe throughout (TypeScript strict mode)
- Comprehensive error logging
- Clear separation: UI → API → MCP Client → SCAHA MCP Server

## 13) Acceptance Criteria

### MVP (Schedule Queries Only)
- ✅ **Given** user asks "Who does the 14B Jr Kings play on October 5th?"
  **When** system calls `get_schedule` with normalized params
  **Then** response includes opponent, time, venue, rink, and jersey color

- ✅ **Given** user says "14B"
  **When** system processes query
  **Then** division is normalized to "14U B Regular Season"

- ✅ **Given** user asks about "Jr Kings" when 3 teams exist
  **When** system detects ambiguity
  **Then** prompt user: "Which Jr. Kings team: (1), (2), or (3)?"

- ✅ **Given** home game
  **When** formatting response
  **Then** jersey color = "dark" (home team wears dark)

- ✅ **Given** away game
  **When** formatting response
  **Then** jersey color = "white/light" (away team wears white)

### Post-MVP (Travel Time Features)
- ✅ **Given** user asks "When do we leave?" and game is at 10:00 AM
  **When** `before_game_minutes=60` and `get_ready_minutes=45`
  **Then** `desired_arrival=9:00 AM` and `wake_time=leave_time - 45min`

- ✅ **Given** `wake_time_local` < `min_wake_time`
  **When** computing schedule
  **Then** hotel suggestions and Google Maps link are displayed

- ✅ **Given** game on DST boundary date
  **When** converting times
  **Then** local/UTC times reflect correct offset (use date-fns-tz)

## 14) Future Enhancements (Nice-to-Haves)

### Phase 2 Features
1. **User Profiles & Preferences**:
   - Save favorite team, home address, wake time preferences
   - Multi-team support (track multiple kids on different teams)

2. **Calendar Integration**:
   - Export games to Google Calendar / iCal
   - Automated reminders (wake time, leave time, game time)

3. **Team Logos & Branding**:
   - Display team logos in chat responses
   - Maintain small logo DB keyed by team/league

4. **Advanced Analytics**:
   - "Show me our hardest stretch of games" (based on opponent standings)
   - "Which teams do we play most often?"
   - Season travel statistics

5. **Venue Database**:
   - One-time scrape/build of complete venue → address directory
   - Periodic refresh for new rinks
   - Include venue amenities (pro shop, snack bar, WiFi)

6. **Multi-Modal Input**:
   - Voice input for schedule queries
   - Screenshot upload of printed schedules

### Phase 3 Features (Advanced)
7. **Team Communication**:
   - Carpool coordination
   - Share game details with team parents

8. **Live Game Updates**:
   - Score tracking (if SCAHA provides live updates)
   - "How's our game going?" queries

9. **Multi-League Support**:
   - Expand beyond SCAHA to other youth hockey leagues
   - Support travel teams, tournaments

10. **Weather Integration**:
    - Outdoor game weather forecasts
    - Travel condition alerts

## 15) Development Phases

### Phase 1: MVP - Schedule Chat (Current)
**Goal**: Deploy working chat interface that answers schedule questions

**Tasks**:
- [x] SCAHA MCP Server built (completed separately)
- [ ] Clone typescript-next-starter as base
- [ ] Configure MCP client for StreamableHTTP transport
- [ ] Implement system prompt with input normalization
- [ ] Test basic schedule queries
- [ ] Deploy to Vercel

**Success Metrics**:
- User can ask "Who does 14B Jr Kings play on Oct 5?" and get correct answer
- Team/division normalization works correctly
- Response time < 3 seconds

### Phase 2: Travel Time Calculator
**Goal**: Add Google Routes API integration for wake/leave times

**Tasks**:
- [ ] Build venue → address lookup table
- [ ] Integrate Google Routes API
- [ ] Implement travel time calculation workflow
- [ ] Add user preferences storage (start address, wake time, etc.)
- [ ] Hotel suggestion logic

**Success Metrics**:
- User can ask "When do we leave?" and get accurate wake/leave times
- DST handling is correct
- Hotel suggestions trigger when appropriate

### Phase 3: Polish & Enhancements
**Goal**: Add nice-to-have features for production launch

**Tasks**:
- [ ] User profiles for multi-team support
- [ ] Calendar export
- [ ] Team logos
- [ ] Voice input
- [ ] Analytics features

## 16) Appendix: Sample Data

### Sample SCAHA MCP Server Response
```json
{
  "games": [
    {
      "game_id": "149151748",
      "date": "2025-10-05",
      "time": "07:00:00",
      "type": "Game",
      "status": "Scheduled",
      "home": "Jr. Kings (1)",
      "away": "OC Hockey (1)",
      "home_score": null,
      "away_score": null,
      "venue": "Great Park Ice & Fivepoint Arena",
      "rink": "1"
    }
  ]
}
```

### Sample Venue Lookup Table
```typescript
export const VENUE_ADDRESSES = {
  "Great Park Ice & Fivepoint Arena": {
    address: "888 Ridge Valley, Irvine, CA 92618",
    coordinates: { lat: 33.6845, lng: -117.7307 }
  },
  "Aliso Viejo Ice": {
    address: "27741 La Paz Rd, Aliso Viejo, CA 92656",
    coordinates: { lat: 33.5786, lng: -117.7268 }
  },
  "Anaheim ICE": {
    address: "300 W Lincoln Ave, Anaheim, CA 92805",
    coordinates: { lat: 33.8353, lng: -117.9203 }
  },
  // ... more venues
};
```

---

**Document Version**: 2.0
**Last Updated**: 2025-10-02
**Author**: HockeyGoTime Development Team
