#!/usr/bin/env node
/**
 * Inspect SCAHA Stats Tool Schemas
 *
 * Shows the exact parameter requirements for stats tools.
 *
 * Usage:
 *   pnpm tsx scripts/inspect-stats-tools.ts
 */

import { getSchahaMCPClient } from '../lib/mcp/client/scaha-client.js';

async function inspectStatsTools() {
  console.log('🔍 Inspecting SCAHA MCP stats tool schemas...\n');

  const client = getSchahaMCPClient();

  try {
    await client.connect();
    const tools = await client.getTools();

    const statsTools = ['get_team_stats', 'get_player_stats'];

    for (const toolName of statsTools) {
      const tool = tools[toolName];
      if (!tool) {
        console.log(`\n❌ Tool '${toolName}' not found`);
        continue;
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔧 ${toolName}`);
      console.log(`${'='.repeat(80)}\n`);

      console.log(`Description: ${tool.description || 'N/A'}\n`);

      console.log('Parameters:');
      console.log(JSON.stringify(tool.parameters, null, 2));
      console.log('');
    }

    await client.disconnect();
  } catch (error: any) {
    console.error('❌ Error inspecting tools:', error.message);
    process.exit(1);
  }
}

inspectStatsTools();
