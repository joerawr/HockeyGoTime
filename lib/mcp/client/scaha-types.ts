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
  serverPath: string;           // Path to SCAHA MCP server executable (legacy, not used for HTTP)
  serverUrl?: string;           // Issue #3: HTTP endpoint URL for remote MCP server
}

// Tool: get_team_stats
export interface SchahaGetTeamStatsParams {
  season: string;               // e.g., "2024-25"
  division: string;             // e.g., "14U B" (selects "14U B Regular Season" from dropdown)
  team_slug: string;            // e.g., "Jr. Kings (1)"
}

export interface SchahaTeamStats {
  team: string;                 // Team name
  gp: number;                   // Games played
  w: number;                    // Wins
  l: number;                    // Losses
  t: number;                    // Ties
  points: number;               // Total points
  gf: number;                   // Goals for
  ga: number;                   // Goals against
  gd: number;                   // Goal differential
}

// Tool: get_player_stats
export interface SchahaGetPlayerStatsParams {
  season: string;               // e.g., "2024-25"
  division: string;             // Division name (e.g., "14U B")
  team_slug: string;            // Team identifier (e.g., "Jr. Kings (1)")
  player: {
    name?: string;              // Player name (optional if number provided)
    number?: string;            // Player number (optional if name provided)
  };
  category?: string;            // "goalies" for goalie stats (defaults to skaters)
}

export interface SchahaPlayerSkaterStats {
  number: string;               // Ranking number (NOT jersey number) - sorted by points, then alphabetically by first name for ties
  name: string;                 // Player name
  team: string;                 // Team name
  gp: number;                   // Games played
  g: number;                    // Goals
  a: number;                    // Assists
  pts: number;                  // Points
  pims: number;                 // Penalty minutes
}

export interface SchahaPlayerGoalieStats {
  number: string;               // Ranking number (NOT jersey number) - sorted by goalie stats
  name: string;                 // Player name
  team: string;                 // Team name
  gp: number;                   // Games played
  minutes: number;              // Minutes played
  shots: number;                // Shots against
  saves: number;                // Saves
  sv_percent: string;           // Save percentage (e.g., "0.923")
  gaa: string;                  // Goals against average (e.g., "2.45")
}

export type SchahaPlayerStats = SchahaPlayerSkaterStats | SchahaPlayerGoalieStats;
