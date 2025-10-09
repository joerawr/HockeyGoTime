# API Contract: SCAHA MCP Tools

**Service**: SCAHA MCP Server (remote Vercel deployment)
**Endpoint**: `https://scaha-mcp.vercel.app/api/mcp`
**Transport**: StreamableHTTP via `StreamableHTTPClientTransport`
**Purpose**: Retrieve SCAHA hockey schedule and statistics data via Model Context Protocol

---

## Connection

### Transport Configuration

```typescript
import { experimental_createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@ai-sdk/mcp/streamable-http';

const transport = new StreamableHTTPClientTransport(
  new URL(process.env.SCAHA_MCP_URL || 'https://scaha-mcp.vercel.app/api/mcp')
);

const client = await experimental_createMCPClient({
  transport,
});
```

### Lifecycle Management

**Critical**: Close client AFTER streaming completes to avoid "closed client" errors.

```typescript
const result = streamText({
  model: openai('gpt-5-mini'),
  messages,
  tools: await client.tools(), // Auto-discovers all MCP tools
  onFinish: async () => {
    await client.disconnect(); // Close here, not before!
  },
});
```

---

## Tool: get_schedule

**Purpose**: Retrieve hockey schedule for a specific team and season

### Input Schema

```typescript
interface GetScheduleInput {
  season: string;            // e.g., "2025/2026"
  division: string;          // e.g., "14U B"
  team: string;              // e.g., "jr-kings-1" (slug format)
  date?: string;             // Optional: filter by date, ISO 8601 (YYYY-MM-DD)
}
```

**Parameter Details**:
- `season`: Format "YYYY/YYYY", e.g., "2025/2026"
- `division`: Normalized division name, e.g., "14U B", "16U A"
- `team`: Team slug (lowercase, hyphenated), e.g., "jr-kings-1", "oc-hockey-2"
- `date`: Optional date filter (returns only games on/after this date)

### Output Schema

```typescript
interface GetScheduleOutput {
  team: string;              // Team name, e.g., "Jr. Kings (1)"
  division: string;          // Division, e.g., "14U B"
  season: string;            // Season, e.g., "2025/2026"
  games: Array<{
    id: string;              // Unique game ID
    date: string;            // ISO 8601 date (YYYY-MM-DD)
    time: string;            // 24-hour time (HH:MM)
    timezone: string;        // IANA timezone, e.g., "America/Los_Angeles"
    homeTeam: string;        // e.g., "Jr. Kings (1)"
    awayTeam: string;        // e.g., "OC Hockey (1)"
    homeJersey: string;      // e.g., "Dark"
    awayJersey: string;      // e.g., "White"
    venue: string;           // e.g., "Anaheim Ice"
    rink?: string;           // Optional, e.g., "Rink 1"
    gameType?: string;       // Optional, e.g., "Regular Season", "Playoff"
  }>;
}
```

### Example Usage

**Request**:
```json
{
  "name": "get_schedule",
  "arguments": {
    "season": "2025/2026",
    "division": "14U B",
    "team": "jr-kings-1",
    "date": "2025-10-05"
  }
}
```

**Response**:
```json
{
  "team": "Jr. Kings (1)",
  "division": "14U B",
  "season": "2025/2026",
  "games": [
    {
      "id": "2025-10-05-14UB-jrkings1-ochockey1",
      "date": "2025-10-05",
      "time": "07:00",
      "timezone": "America/Los_Angeles",
      "homeTeam": "Jr. Kings (1)",
      "awayTeam": "OC Hockey (1)",
      "homeJersey": "Dark",
      "awayJersey": "White",
      "venue": "Anaheim Ice",
      "rink": "Rink 1",
      "gameType": "Regular Season"
    }
  ]
}
```

### Caching Recommendation

- **Cache Key**: `schedule:{season}:{division}:{team}`
- **TTL**: 24 hours (games rarely change once published)
- **Invalidation**: Manual refresh or scheduled nightly update

---

## Tool: get_team_stats

**Purpose**: Retrieve team performance statistics and league standing

**Status**: ⚠️ NEEDS VERIFICATION - Check if implemented in SCAHA MCP server

### Input Schema

```typescript
interface GetTeamStatsInput {
  season: string;            // e.g., "2025/2026"
  division: string;          // e.g., "14U B"
  team: string;              // e.g., "jr-kings-1" (slug format)
}
```

### Output Schema

```typescript
interface GetTeamStatsOutput {
  team: string;              // Team name, e.g., "Jr. Kings (1)"
  division: string;          // Division, e.g., "14U B"
  season: string;            // Season, e.g., "2025/2026"
  wins: number;
  losses: number;
  ties: number;
  overtimeLosses?: number;   // Optional
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  points: number;            // Typically: wins * 2 + ties + OTL
  leagueRank?: number;       // Position in division (1 = first place)
}
```

### Example Usage

**Request**:
```json
{
  "name": "get_team_stats",
  "arguments": {
    "season": "2025/2026",
    "division": "14U B",
    "team": "jr-kings-1"
  }
}
```

**Response**:
```json
{
  "team": "Jr. Kings (1)",
  "division": "14U B",
  "season": "2025/2026",
  "wins": 12,
  "losses": 5,
  "ties": 2,
  "overtimeLosses": 1,
  "goalsFor": 68,
  "goalsAgainst": 42,
  "goalDifferential": 26,
  "points": 27,
  "leagueRank": 2
}
```

### Caching Recommendation

- **Cache Key**: `stats:team:{season}:{division}:{team}`
- **TTL**: 24 hours (updated after games)

---

## Tool: get_player_stats

**Purpose**: Retrieve individual player statistics

**Status**: ⚠️ NEEDS VERIFICATION - Check if implemented in SCAHA MCP server

### Input Schema

```typescript
interface GetPlayerStatsInput {
  season: string;            // e.g., "2025/2026"
  division: string;          // e.g., "14U B"
  team: string;              // e.g., "jr-kings-1" (slug format)
  player: string;            // Player name, e.g., "Johnny Smith"
}
```

### Output Schema

```typescript
interface GetPlayerStatsOutput {
  playerName: string;        // e.g., "Johnny Smith"
  playerNumber?: number;     // Optional jersey number
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"
  position?: 'Forward' | 'Defense' | 'Goalie';

  // Skater Stats
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;

  // Goalie Stats (if position is 'Goalie')
  goalie?: {
    saves: number;
    shotsAgainst: number;
    goalsAgainst: number;
    savePercentage: number;  // 0.0 - 1.0
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
  };
}
```

### Example Usage

**Request**:
```json
{
  "name": "get_player_stats",
  "arguments": {
    "season": "2025/2026",
    "division": "14U B",
    "team": "jr-kings-1",
    "player": "Johnny Smith"
  }
}
```

**Response**:
```json
{
  "playerName": "Johnny Smith",
  "playerNumber": 14,
  "team": "Jr. Kings (1)",
  "division": "14U B",
  "season": "2025/2026",
  "position": "Forward",
  "gamesPlayed": 18,
  "goals": 12,
  "assists": 15,
  "points": 27,
  "penaltyMinutes": 10
}
```

### Caching Recommendation

- **Cache Key**: `stats:player:{season}:{division}:{team}:{player}`
- **TTL**: 24 hours (updated after games)

---

## Error Handling

### MCP Protocol Errors

**Connection Failures**:
```typescript
try {
  const client = await experimental_createMCPClient({ transport });
} catch (error) {
  // Network error, server unavailable, etc.
  throw new Error('Unable to connect to SCAHA data service. Please try again later.');
}
```

**Tool Execution Errors**:
```typescript
const result = streamText({
  tools: await client.tools(),
  onError: (error) => {
    // Tool returned error (e.g., team not found, invalid season)
    console.error('MCP tool error:', error);
    // AI will handle gracefully with user-friendly message
  },
});
```

### Common Error Scenarios

**Team Not Found**:
- **Cause**: Invalid team slug or team not registered in division
- **User Message**: "I couldn't find that team in the {division} division. Please check the team name."

**Invalid Season**:
- **Cause**: Season format incorrect or season not yet available
- **User Message**: "Schedule data is not available for the {season} season yet."

**No Games Found**:
- **Cause**: Valid inputs but no games scheduled (e.g., offseason)
- **User Message**: "No games found for {team} in {division}. The season may not have started yet."

---

## Implementation Notes

### Tool Discovery

MCP clients automatically discover all available tools via `client.tools()`:

```typescript
const tools = await client.tools(); // Returns array of all MCP tools
// Tools are dynamically typed based on server's tool definitions
```

No need to manually define tool schemas in HockeyGoTime code—AI SDK handles this automatically.

### AI Model Integration

Tools are passed directly to `streamText`:

```typescript
const result = streamText({
  model: openai('gpt-5-mini'), // or 'gpt-5' for complex queries
  messages,
  tools: await schahaClient.tools(), // All MCP tools auto-injected
});
```

AI decides when to call tools based on user query and system prompt instructions.

### System Prompt Integration

See `components/agent/hockey-prompt.ts` for:
- Input normalization rules ("14B" → "14U B", "jr kings 1" → "jr-kings-1")
- Default season handling (current season vs. explicit season)
- Tool usage guidance (when to call `get_schedule` vs. `get_team_stats`)

---

## Testing

### Verification Checklist

Before implementing stats features (P2):

1. ✅ Verify `get_schedule` tool is working (CONFIRMED - already implemented)
2. ❓ Check if `get_team_stats` tool exists in SCAHA MCP server
3. ❓ Check if `get_player_stats` tool exists in SCAHA MCP server
4. ❓ If missing: coordinate with SCAHA MCP maintainer (user) to add tools
5. ❓ If present: verify response format matches contract above

### Test Cases

**TC1: Retrieve Schedule**
- Input: `{ season: "2025/2026", division: "14U B", team: "jr-kings-1" }`
- Expected: Array of games with all required fields

**TC2: Filter by Date**
- Input: `{ ..., date: "2025-10-05" }`
- Expected: Only games on/after 2025-10-05

**TC3: Team Not Found**
- Input: `{ team: "invalid-team-xyz" }`
- Expected: Error or empty games array

**TC4: Retrieve Team Stats** (if implemented)
- Input: `{ season: "2025/2026", division: "14U B", team: "jr-kings-1" }`
- Expected: Team record with wins/losses/points

**TC5: Retrieve Player Stats** (if implemented)
- Input: `{ ..., player: "Johnny Smith" }`
- Expected: Player stats with goals/assists/points

---

## Next Steps

1. **Verify Stats Tools**: Check SCAHA MCP server repository for `get_team_stats` and `get_player_stats` implementations
2. **Update Contract**: If tools exist but schema differs, update this contract to match actual implementation
3. **Coordinate with Maintainer**: If tools don't exist, request implementation (user is SCAHA MCP maintainer)
4. **Implement Types**: Create TypeScript types in `types/schedule.ts` and `types/stats.ts` based on verified schemas
