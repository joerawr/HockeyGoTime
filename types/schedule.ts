/**
 * Schedule and Game Types
 * Represents hockey game schedule data from SCAHA MCP server
 */

export interface Game {
  // Identifiers
  id: string;                // Unique game identifier, e.g., "2025-10-05-14UB-jrkings1-ochockey1"

  // Teams
  homeTeam: string;          // e.g., "Jr. Kings (1)"
  awayTeam: string;          // e.g., "OC Hockey (1)"
  homeJersey: string;        // e.g., "Dark"
  awayJersey: string;        // e.g., "White"

  // Timing
  date: string;              // ISO 8601 date, e.g., "2025-10-05"
  time: string;              // 24-hour format, e.g., "07:00"
  timezone: string;          // e.g., "America/Los_Angeles"

  // Location
  venue: string;             // Venue name from SCAHA, e.g., "Anaheim Ice"
  rink?: string;             // Optional rink number, e.g., "Rink 1"

  // Metadata
  season: string;            // e.g., "2025/2026"
  division: string;          // e.g., "14U B"
  gameType?: string;         // e.g., "Regular Season", "Playoff"
}

export interface ScheduleData {
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"
  games: Game[];             // Array of games
  lastUpdated: string;       // ISO 8601 timestamp
}
