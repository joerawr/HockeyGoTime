#!/usr/bin/env node
/**
 * List SCAHA MCP Tools
 *
 * Connects to the SCAHA MCP server and lists all available tools.
 *
 * Usage:
 *   pnpm tsx scripts/list-scaha-tools.ts
 */

import { getSchahaMCPClient } from '../lib/mcp/client/scaha-client.js';

async function listScahaTools() {
  console.log('🔍 Connecting to SCAHA MCP server...\n');

  const client = getSchahaMCPClient();

  try {
    await client.connect();

    const tools = await client.getTools();
    const toolNames = Object.keys(tools);

    console.log(`\n📋 SCAHA MCP Tools (${toolNames.length} total):\n`);

    for (const toolName of toolNames) {
      const tool = tools[toolName];
      console.log(`\n🔧 ${toolName}`);

      if (tool.description) {
        console.log(`   Description: ${tool.description}`);
      }

      if (tool.parameters?.properties) {
        console.log(`   Parameters:`);
        const params = tool.parameters.properties;
        for (const [paramName, paramDef] of Object.entries(params)) {
          const def = paramDef as any;
          const required = tool.parameters.required?.includes(paramName) ? '(required)' : '(optional)';
          console.log(`     - ${paramName}: ${def.type || 'unknown'} ${required}`);
          if (def.description) {
            console.log(`       ${def.description}`);
          }
        }
      }
    }

    console.log('\n✅ Tool listing complete\n');

    await client.disconnect();
  } catch (error: any) {
    console.error('❌ Error listing tools:', error.message);
    process.exit(1);
  }
}

listScahaTools();
