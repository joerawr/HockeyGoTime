/**
 * Player and Team Statistics Types
 * For SCAHA MCP stats tools integration
 */

/**
 * Player Statistics
 * Individual player performance metrics for a season
 */
export interface PlayerStats {
  // Identity
  playerName: string;        // e.g., "Johnny Smith"
  playerNumber?: number;     // Optional jersey number
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Stats (for forwards/defensemen)
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;

  // Goalie Stats (if position is goalie)
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

  // Metadata
  position?: 'Forward' | 'Defense' | 'Goalie';
  lastUpdated: string;       // ISO 8601 timestamp
}

/**
 * Team Statistics
 * Team performance and league standing
 */
export interface TeamStats {
  // Identity
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Record
  wins: number;
  losses: number;
  ties: number;
  overtimeLosses?: number;   // Optional, if tracked by league

  // Scoring
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;  // goalsFor - goalsAgainst

  // League Standing
  points: number;            // Typically: wins * 2 + ties + OTL
  leagueRank?: number;       // Position in division (1 = first place)

  // Metadata
  lastUpdated: string;       // ISO 8601 timestamp
}
