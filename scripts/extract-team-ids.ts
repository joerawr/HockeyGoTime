/**
 * Extract PGHL Team IDs from Firecrawl Result
 *
 * Parses firecrawl-result.md and extracts team names and IDs from markdown links
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Read the firecrawl result
const filePath = join(process.cwd(), "firecrawl-result.md");
const content = readFileSync(filePath, "utf-8");

// Regex to match: Team Name](https://www.pacificgirlshockey.com/stats#/1447/team/123456)
// The markdown has the team name as plain text before the URL
const teamLinkRegex = /([^\]\\]+)\]\(https:\/\/www\.pacificgirlshockey\.com\/stats#\/1447\/team\/(\d+)\)/g;

const teamMap: Record<string, string> = {};
let match;

while ((match = teamLinkRegex.exec(content)) !== null) {
  const teamName = match[1].trim(); // Remove leading/trailing whitespace
  const teamId = match[2];
  teamMap[teamName] = teamId;
}

console.log("📊 Extracted Team IDs:");
console.log(`   Found ${Object.keys(teamMap).length} teams\n`);

// Display all teams
Object.entries(teamMap).forEach(([name, id]) => {
  console.log(`   ${name} → ${id}`);
});

// Generate TypeScript mapping file
const mappingFileContent = `/**
 * PGHL Team, Season, and Division ID Mappings
 *
 * Auto-generated on ${new Date().toISOString()}
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
export const PGHL_TEAM_IDS: Record<string, string> = ${JSON.stringify(teamMap, null, 2)};

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
`;

// Write to lib/pghl-mappings.ts
const outputPath = join(process.cwd(), "lib", "pghl-mappings.ts");
writeFileSync(outputPath, mappingFileContent, "utf-8");

console.log(`\n✅ Mapping file generated:`);
console.log(`   ${outputPath}`);
console.log(`\n🎉 Done! All ${Object.keys(teamMap).length} teams mapped.`);
