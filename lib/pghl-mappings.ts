/**
 * PGHL Team, Season, and Division ID Mappings
 *
 * Auto-generated on 2025-10-11T23:14:54.285Z
 * Source: Firecrawl extraction from pacificgirlshockey.com
 *
 * These mappings convert human-readable names to PGHL system IDs
 * for use with the new iCal-based schedule tools.
 */

// ============================================================================
// TEAM NAME → TEAM ID MAPPINGS
// ============================================================================

/**
 * Complete team ID mappings for 2025-26 season
 */
export const PGHL_TEAM_IDS: Record<string, string> = {
  "Anaheim Lady Ducks 12u AA": "586893",
  "Anaheim Lady Ducks 12u AAA": "587522",
  "Anaheim Lady Ducks 14u AA": "588120",
  "Anaheim Lady Ducks 16u AA": "588181",
  "Anaheim Lady Ducks 19u AA": "588182",
  "CA Goldrush-1 16u AA": "588183",
  "CA Goldrush 12u A": "586887",
  "CA Goldrush-2 16u AA": "588184",
  "Delta Knights 12u AA": "586891",
  "LA Lions 12u AA": "586888",
  "LA Lions 12u AAA": "587523",
  "Las Vegas Storm 12u AA": "586889",
  "Las Vegas Storm 14u AA": "588124",
  "Portland Jr Winterhawks 19u AA": "588185",
  "San Diego Angels 12u A": "586894",
  "San Diego Angels 14u AA": "588123",
  "San Diego Angels 19u AA": "588187",
  "San Jose Jr Sharks 12u AAA": "587526",
  "San Jose Jr Sharks 14u AA": "588121",
  "San Jose Jr Sharks 19u AA": "588186",
  "Santa Clarita Lady Flyers 12u AA": "586890",
  "Santa Clarita Lady Flyers 14u AA": "588122",
  "Tri Valley Lady Blue Devils 12u AAA": "587525",
  "Vacaville Jets 16u AA": "588188",
  "Vegas Jr. Golden Knights 12u A": "586892",
  "Vegas Jr Golden Knights 14u AA": "588125",
  "Vegas Jr Golden Knights 16u AA": "588189"
};

// ============================================================================
// SEASON NAME → SEASON ID MAPPINGS
// ============================================================================

/**
 * Known season IDs (extracted from iCal URLs)
 */
export const PGHL_SEASON_IDS: Record<string, string> = {
  "2025-26": "9486",
  "current": "9486", // Current season alias
};

// ============================================================================
// DIVISION NAME → DIVISION ID MAPPINGS
// ============================================================================

/**
 * Division IDs (to be discovered via list_schedule_options if needed)
 * For now, these are not required since we can filter by team_id directly
 */
export const PGHL_DIVISION_IDS: Record<string, string> = {
  // TODO: Populate with division IDs when available
  // Expected divisions: 12u A, 12u AA, 12u AAA, 14u AA, 16u AA, 19u AA
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * PGHL League ID (constant across all queries)
 */
export const PGHL_LEAGUE_ID = "1447";

/**
 * PGHL Client Service ID (constant for iCal feeds)
 */
export const PGHL_CLIENT_SERVICE_ID = "05e3fa78-061c-4607-a558-a54649c5044f";

/**
 * Base URL for PGHL iCal feeds
 */
export const PGHL_ICAL_BASE_URL = "https://web.api.digitalshift.ca/partials/stats/schedule/ical";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get team ID from team name
 * @param teamName - Full team name (e.g., "Las Vegas Storm 12u AA")
 * @returns Team ID if found, undefined otherwise
 */
export function getPghlTeamId(teamName: string): string | undefined {
  return PGHL_TEAM_IDS[teamName];
}

/**
 * Get season ID from season name
 * @param seasonName - Season name (e.g., "2025-26" or "current")
 * @returns Season ID if found, undefined otherwise
 */
export function getPghlSeasonId(seasonName: string): string | undefined {
  return PGHL_SEASON_IDS[seasonName];
}

/**
 * Get division ID from division name
 * @param divisionName - Division name (e.g., "12u AA")
 * @returns Division ID if found, undefined otherwise
 */
export function getPghlDivisionId(divisionName: string): string | undefined {
  return PGHL_DIVISION_IDS[divisionName];
}

/**
 * Get all known team names
 * @returns Array of team names
 */
export function getAllPghlTeamNames(): string[] {
  return Object.keys(PGHL_TEAM_IDS);
}

/**
 * Check if a team ID mapping exists
 * @param teamName - Team name to check
 * @returns True if mapping exists
 */
export function hasPghlTeamId(teamName: string): boolean {
  return teamName in PGHL_TEAM_IDS;
}
