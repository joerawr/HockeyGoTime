/**
 * TypeScript types for PGHL MCP tools
 */

export interface PghlSelectOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface PghlScheduleOptions {
  seasons: PghlSelectOption[];
  divisions: PghlSelectOption[];
  teams: PghlSelectOption[];
}

export interface PghlListScheduleOptionsParams {
  season?: string;
  division?: string;
}

export interface PghlGetScheduleParams {
  season: string;
  division: string;
  team: string;
}

export interface PghlGame {
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  division: string;
  status?: string;
  rink?: string;
  gameType?: string;
}

export interface PghlGetScheduleResult {
  team: string;
  season: string;
  division: string;
  games: PghlGame[];
  totalGames: number;
}

export interface PghlMCPClientConfig {
  serverUrl?: string;    // HTTP endpoint URL (defaults to https://pghl-mcp.vercel.app/api/mcp)
  serverPath?: string;   // Path to local PGHL MCP server for STDIO transport
  useStdio?: boolean;    // Force STDIO transport (auto-detected if serverPath is provided)
}
