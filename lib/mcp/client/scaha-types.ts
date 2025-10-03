/**
 * TypeScript types for SCAHA MCP tools
 * Based on scaha.net-mcp server specification
 */

export interface SchahaGetScheduleParams {
  season: string;              // e.g., "2025/2026"
  division?: string;            // e.g., "14U B"
  team_slug?: string;           // e.g., "jr-kings-1"
  date_range?: {
    start: string;              // YYYY-MM-DD
    end: string;                // YYYY-MM-DD
  };
}

export interface SchahaGame {
  game_id: string;              // Unique game ID
  date: string;                 // YYYY-MM-DD
  time: string;                 // HH:MM:SS (24-hour format, PT)
  type: string;                 // "Game", "Playoff", "Tournament"
  status: string;               // "Scheduled" or "Final"
  home: string;                 // Home team name
  away: string;                 // Away team name
  home_score: number | null;    // Score or null if not played
  away_score: number | null;    // Score or null if not played
  venue: string;                // Venue name
  rink: string;                 // Rink identifier
}

export interface SchahaGetScheduleResult {
  games: SchahaGame[];
}

export interface MCPClientConfig {
  serverPath: string;           // Path to SCAHA MCP server executable
}
