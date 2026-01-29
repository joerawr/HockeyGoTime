#!/usr/bin/env node
/**
 * Test SCAHA MCP Stats Tools
 *
 * Tests get_team_stats and get_player_stats tools with real queries.
 *
 * Usage:
 *   pnpm tsx scripts/test-scaha-stats.ts
 */

import 'dotenv/config';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getSchahaMCPClient } from '../lib/mcp/client/scaha-client.js';

async function testStatsTools() {
  console.log('🔍 Testing SCAHA MCP stats tools...\n');

  const client = getSchahaMCPClient();

  try {
    await client.connect();
    const tools = await client.getTools();

    console.log('📊 Test 1: Get Team Stats\n');
    console.log('Query: "Show me the standings for 14U B Regular Season Jr. Kings (1)"\n');

    const teamStatsResult = await generateText({
      model: google('gemini-2.5-flash-preview-09-2025'),
      tools,
      prompt: 'Get the team stats for 14U B Regular Season, Jr. Kings (1) for the 2025/2026 season. Show me their wins, losses, and standing.',
      maxSteps: 5,
    });

    console.log('✅ Team Stats Result:');
    console.log(teamStatsResult.text);
    console.log('\n📊 Tool Calls and Results:');
    for (const step of teamStatsResult.steps) {
      if ('toolCalls' in step && step.toolCalls) {
        for (const toolCall of step.toolCalls) {
          console.log(`\n  Tool: ${toolCall.toolName}`);
          console.log(`  Args: ${JSON.stringify(toolCall.args, null, 2)}`);
        }
      }
      if ('toolResults' in step && step.toolResults) {
        for (const toolResult of step.toolResults) {
          const resultStr = JSON.stringify(toolResult.result, null, 2);
          console.log(`\n  Result (${resultStr?.length || 0} chars): ${resultStr?.substring(0, 1000) || 'null'}...`);
        }
      }
    }
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('📊 Test 2: Get Player Stats\n');
    console.log('Query: "Show me player stats for 14U B Regular Season Jr. Kings (1)"\n');

    const playerStatsResult = await generateText({
      model: google('gemini-2.5-flash-preview-09-2025'),
      tools,
      prompt: 'Get the player stats for 14U B Regular Season, Jr. Kings (1) for the 2025/2026 season. Show me the top 3 scorers.',
      maxSteps: 5,
    });

    console.log('✅ Player Stats Result:');
    console.log(playerStatsResult.text);
    console.log('\n📊 Tool Calls and Results:');
    for (const step of playerStatsResult.steps) {
      if ('toolCalls' in step && step.toolCalls) {
        for (const toolCall of step.toolCalls) {
          console.log(`\n  Tool: ${toolCall.toolName}`);
          console.log(`  Args: ${JSON.stringify(toolCall.args, null, 2)}`);
        }
      }
      if ('toolResults' in step && step.toolResults) {
        for (const toolResult of step.toolResults) {
          const resultStr = JSON.stringify(toolResult.result, null, 2);
          console.log(`\n  Result (${resultStr?.length || 0} chars): ${resultStr?.substring(0, 1000) || 'null'}...`);
        }
      }
    }
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('✅ Both stats tools are working!\n');

    await client.disconnect();
  } catch (error: any) {
    console.error('❌ Error testing stats tools:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testStatsTools();
