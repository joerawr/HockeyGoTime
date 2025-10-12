/**
 * Fetch PGHL Team IDs Script
 *
 * Connects to local PGHL MCP server via STDIO and fetches all team IDs
 * using the list_schedule_options tool. Outputs a mapping file for use in HGT.
 */

import { experimental_createMCPClient } from "ai";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "fs";
import { join } from "path";

interface SelectOption {
  value: string;
  label: string;
  selected: boolean;
}

interface ScheduleOptions {
  seasons: SelectOption[];
  divisions: SelectOption[];
  teams: SelectOption[];
}

async function fetchPghlTeams() {
  const serverPath = process.env.PGHL_MCP_SERVER_PATH || "../pghl-mcp/dist/index.js";

  console.log("🚀 Connecting to local PGHL MCP server...");
  console.log(`   Path: ${serverPath}`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = await experimental_createMCPClient({ transport });

  console.log("✅ Connected to PGHL MCP server\n");

  try {
    // Get the list_schedule_options tool
    const tools = await client.tools();
    const listOptionsToolName = Object.keys(tools).find(
      (name) => name.includes("list_schedule_options") || name === "list_schedule_options"
    );

    if (!listOptionsToolName) {
      throw new Error("list_schedule_options tool not found");
    }

    console.log("🔍 Fetching all teams (no filters)...");

    // Call list_schedule_options with no filters to get everything
    const tool = tools[listOptionsToolName];
    const result = await (tool.execute as any)({});

    console.log("✅ Received schedule options\n");

    // Parse the result
    const options: ScheduleOptions = JSON.parse(
      typeof result === "string" ? result : JSON.stringify(result)
    );

    // Build team mapping
    const teamMap: Record<string, string> = {};
    for (const team of options.teams) {
      teamMap[team.label] = team.value;
    }

    // Build season mapping
    const seasonMap: Record<string, string> = {};
    for (const season of options.seasons) {
      seasonMap[season.label] = season.value;
    }

    // Build division mapping
    const divisionMap: Record<string, string> = {};
    for (const division of options.divisions) {
      divisionMap[division.label] = division.value;
    }

    // Output summary
    console.log("📊 Summary:");
    console.log(`   Seasons:   ${options.seasons.length}`);
    console.log(`   Divisions: ${options.divisions.length}`);
    console.log(`   Teams:     ${options.teams.length}\n`);

    // Generate TypeScript mapping file
    const mappingFileContent = `/**
 * PGHL Team, Season, and Division ID Mappings
 *
 * Auto-generated on ${new Date().toISOString()}
 * Source: PGHL MCP Server (list_schedule_options tool)
 *
 * These mappings convert human-readable names to PGHL system IDs
 * for use with the new iCal-based schedule tools.
 */

// Team Name → Team ID
export const PGHL_TEAM_IDS: Record<string, string> = ${JSON.stringify(teamMap, null, 2)};

// Season Name → Season ID
export const PGHL_SEASON_IDS: Record<string, string> = ${JSON.stringify(seasonMap, null, 2)};

// Division Name → Division ID
export const PGHL_DIVISION_IDS: Record<string, string> = ${JSON.stringify(divisionMap, null, 2)};

/**
 * Helper function to get team ID from team name
 */
export function getPghlTeamId(teamName: string): string | undefined {
  return PGHL_TEAM_IDS[teamName];
}

/**
 * Helper function to get season ID from season name
 */
export function getPghlSeasonId(seasonName: string): string | undefined {
  return PGHL_SEASON_IDS[seasonName];
}

/**
 * Helper function to get division ID from division name
 */
export function getPghlDivisionId(divisionName: string): string | undefined {
  return PGHL_DIVISION_IDS[divisionName];
}
`;

    // Write to lib/pghl-mappings.ts
    const outputPath = join(process.cwd(), "lib", "pghl-mappings.ts");
    writeFileSync(outputPath, mappingFileContent, "utf-8");

    console.log("✅ Mapping file generated:");
    console.log(`   ${outputPath}\n`);

    // Display sample teams
    console.log("📋 Sample Teams:");
    options.teams.slice(0, 5).forEach((team) => {
      console.log(`   ${team.label} → ${team.value}`);
    });
    if (options.teams.length > 5) {
      console.log(`   ... and ${options.teams.length - 5} more\n`);
    }

    console.log("🎉 Done! You can now use these mappings in HGT.");
  } catch (error) {
    console.error("💥 Error fetching team IDs:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the script
fetchPghlTeams().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
