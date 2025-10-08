import { HOCKEY_SYSTEM_INSTRUCTIONS } from "@/components/agent/hockey-prompt";
import { getSchahaMCPClient } from "@/lib/mcp";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { scheduleCache, getScheduleCacheKey } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const { messages, preferences } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    // Convert UIMessages to ModelMessages
    const modelMessages = convertToModelMessages(messages);

    // Build system prompt with user preferences context
    let systemPrompt = HOCKEY_SYSTEM_INSTRUCTIONS;
    if (preferences) {
      systemPrompt = systemPrompt
        .replace('{userTeam}', preferences.team || 'not set')
        .replace('{userDivision}', preferences.division || 'not set')
        .replace('{userSeason}', preferences.season || 'not set')
        .replace('{userHomeAddress}', preferences.homeAddress || 'not set');
    } else {
      // No preferences - replace placeholders with "not set"
      systemPrompt = systemPrompt
        .replace('{userTeam}', 'not set')
        .replace('{userDivision}', 'not set')
        .replace('{userSeason}', 'not set')
        .replace('{userHomeAddress}', 'not set');
    }

    // Initialize SCAHA MCP client
    console.log("🚀 Initializing SCAHA MCP client...");
    const schahaClient = getSchahaMCPClient();
    await schahaClient.connect();

    // Retrieve SCAHA tools (get_schedule)
    const tools = await schahaClient.getTools();

    console.log(
      `🔧 HockeyGoTime has access to ${Object.keys(tools).length} SCAHA MCP tools`
    );

    // Wrap tools to add caching and logging
    const wrappedTools = Object.fromEntries(
      Object.entries(tools).map(([toolName, toolDef]) => [
        toolName,
        {
          ...toolDef,
          execute: async (args: any) => {
            console.log(`\n🏒 Tool called: ${toolName}`);
            console.log(`   Input:`, JSON.stringify(args, null, 2));

            // Cache logic for get_schedule tool
            if (toolName === 'get_schedule') {
              const { season, schedule, team, date } = args;
              const cacheKey = getScheduleCacheKey(season, schedule, team, date);

              // Check cache first
              const cachedData = await scheduleCache.get(cacheKey);
              if (cachedData) {
                console.log(`   ⚡ Cache hit: ${cacheKey}`);
                console.log(`   Output (cached):`, JSON.stringify(cachedData, null, 2));
                return cachedData;
              }

              // Cache miss - call MCP tool
              console.log(`   🔍 Cache miss: ${cacheKey}`);
              const startTime = Date.now();
              const result = await toolDef.execute(args);
              const elapsed = Date.now() - startTime;
              console.log(`   ⏱️ MCP call took ${elapsed}ms`);
              console.log(`   Output:`, JSON.stringify(result, null, 2));

              // Store in cache (24 hour TTL by default)
              await scheduleCache.set(cacheKey, result);
              console.log(`   💾 Cached: ${cacheKey}`);

              return result;
            }

            // Default: no caching for other tools (stats tools will be added later)
            const result = await toolDef.execute(args);
            console.log(`   Output:`, JSON.stringify(result, null, 2));
            return result;
          },
        },
      ])
    );

    const result = streamText({
      model: openai("gpt-5-mini"),
      system: systemPrompt,
      messages: modelMessages,
      tools: wrappedTools,
      providerOptions: {
        openai: {
          reasoningEffort: "low",
        },
      },
      stopWhen: stepCountIs(5), // Enable multi-step execution: tool call -> text response
      onFinish: async ({ text, toolCalls, toolResults, steps }) => {
        console.log(`📊 Stream finished:`);
        console.log(`   Text length: ${text?.length || 0}`);
        console.log(`   Tool calls: ${toolCalls?.length || 0}`);
        console.log(`   Tool results: ${toolResults?.length || 0}`);
        console.log(`   Steps: ${steps?.length || 0}`);

        // Close the MCP client after streaming completes
        // This is critical to avoid "closed client" errors
        console.log("🔌 Disconnecting SCAHA MCP client...");
        await schahaClient.disconnect();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("💥 Hockey chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
