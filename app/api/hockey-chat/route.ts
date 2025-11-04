export const runtime = "nodejs";

import { buildScahaPrompt } from "@/components/agent/scaha-prompt";
import { buildPGHLPrompt } from "@/components/agent/pghl-prompt";
import { getSchahaMCPClient, getPghlMCPClient } from "@/lib/mcp";
import { PGHL_TEAM_IDS, PGHL_SEASON_IDS } from "@/lib/pghl-mappings";
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import {
  scheduleCache,
  getScheduleCacheKey,
  getTeamStatsCacheKey,
  getPlayerStatsCacheKey,
} from "@/lib/cache";
import { calculateTravelTimes } from "@/lib/travel/time-calculator";
import {
  DEFAULT_PREFERENCES,
  type UserPreferences,
  type MCPServerId,
} from "@/types/preferences";
import type { TravelCalculation } from "@/types/travel";
import { z } from "zod";
import { resolveVenue } from "@/lib/venue/resolver";
import {
  trackConversation,
  trackTokens,
  trackToolCall,
  trackExternalApiCall,
} from "@/lib/analytics/metrics";
import { MODEL_PRICING } from "@/lib/analytics/constants";

const TRAVEL_API_ERROR_MESSAGE =
  "Sorry the google maps api isn't responding, please use maps.google.com. We'll look into the issue.";
const HOME_ADDRESS_REQUIRED_MESSAGE =
  "I need a starting address to calculate travel times. You can either save your home address in preferences, or tell me your current location (like 'Holiday Inn Express' or '123 Main St, Anaheim, CA').";

function normalizePreferences(raw: any): UserPreferences | null {
  if (!raw) {
    return null;
  }

  const merged = {
    ...DEFAULT_PREFERENCES,
    ...raw,
  };

  const resolvedMcp: MCPServerId =
    merged.mcpServer === "pghl" ? "pghl" : "scaha";

  return {
    mcpServer: resolvedMcp,
    team: merged.team ?? "",
    division: merged.division ?? "",
    season: merged.season ?? DEFAULT_PREFERENCES.season ?? "",
    homeAddress: merged.homeAddress && typeof merged.homeAddress === "string" && merged.homeAddress.trim() !== ""
      ? merged.homeAddress
      : undefined,
    prepTimeMinutes: Number(merged.prepTimeMinutes ?? DEFAULT_PREFERENCES.prepTimeMinutes ?? 30),
    arrivalBufferMinutes: Number(
      merged.arrivalBufferMinutes ?? DEFAULT_PREFERENCES.arrivalBufferMinutes ?? 60
    ),
    minWakeUpTime: merged.minWakeUpTime,
    playerPosition: merged.playerPosition ?? DEFAULT_PREFERENCES.playerPosition ?? "skater",
    darkMode: merged.darkMode ?? DEFAULT_PREFERENCES.darkMode ?? false,
  };
}

const travelToolInputSchema = z.object({
  game: z.object({
    id: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    homeJersey: z.string(),
    awayJersey: z.string(),
    date: z.string(),
    time: z.string(),
    timezone: z.string(),
    venue: z.string(),
    rink: z.string().optional(),
    season: z.string(),
    division: z.string(),
    gameType: z.string().optional(),
  }),
  timezone: z.string().optional(),
  userPreferences: z
    .object({
      team: z.string().optional(),
      division: z.string().optional(),
      season: z.string().optional(),
      homeAddress: z.string().optional(),
      prepTimeMinutes: z.number().optional(),
      arrivalBufferMinutes: z.number().optional(),
      minWakeUpTime: z.string().optional(),
      prepTimeOverride: z.boolean().optional(),
      arrivalBufferOverride: z.boolean().optional(),
    })
    .optional(),
});

type TravelToolArgs = z.infer<typeof travelToolInputSchema>;

type TravelToolResult = TravelCalculation | { errorMessage: string };

export async function POST(request: NextRequest) {
  // T037: Create AbortController with 60s timeout for backend processing
  // Allows complex multi-tool queries (e.g., 9 games × map API calls)
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log("⏱️ Request timeout after 60 seconds");
    abortController.abort();
  }, 60000); // 60 second timeout

  try {
    const { messages, preferences } = await request.json();
    const normalizedPreferences = normalizePreferences(preferences);
    const fallbackMcp =
      (DEFAULT_PREFERENCES.mcpServer as MCPServerId) || "scaha";
    const selectedMcpServer: MCPServerId =
      normalizedPreferences?.mcpServer ??
      (preferences?.mcpServer === "pghl" ? "pghl" : fallbackMcp);
    const selectedMcpLabel = selectedMcpServer === "pghl" ? "PGHL" : "SCAHA";

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    // Convert UIMessages to ModelMessages
    const modelMessages = convertToModelMessages(messages);

    // Build system prompt with user preferences context using builder functions
    let systemPrompt: string;
    if (selectedMcpServer === "pghl") {
      const teamMappingsJson = JSON.stringify(PGHL_TEAM_IDS, null, 2);
      const seasonMappingsJson = JSON.stringify(PGHL_SEASON_IDS, null, 2);
      systemPrompt = buildPGHLPrompt(
        normalizedPreferences,
        teamMappingsJson,
        seasonMappingsJson
      );
    } else {
      systemPrompt = buildScahaPrompt(normalizedPreferences);
    }

    // Initialize MCP client
    console.log(`🚀 Initializing ${selectedMcpLabel} MCP client...`);
    const activeMcpClient =
      selectedMcpServer === "pghl"
        ? getPghlMCPClient()
        : getSchahaMCPClient();
    await activeMcpClient.connect();

    // Retrieve MCP tools (get_schedule, etc.)
    const tools = await activeMcpClient.getTools();

    console.log(
      `🔧 HockeyGoTime has access to ${Object.keys(tools).length} ${selectedMcpLabel} MCP tools`
    );

    // Wrap tools to add caching and logging
    const wrappedMcpTools = Object.fromEntries(
      Object.entries(tools).map(([toolName, toolDef]) => [
        toolName,
        {
          ...toolDef,
          execute: async (args: any) => {
            console.log(`\n🏒 Tool called: ${toolName}`);
            console.log(`   Input:`, JSON.stringify(args, null, 2));

            // Cache logic for get_schedule tool
            if (toolName === 'get_schedule') {
              const {
                season,
                division,
                schedule,
                team,
                team_slug,
                date,
                scope,
              } = args ?? {};

              const resolvedSeason =
                typeof season === "string" && season.trim() !== ""
                  ? season
                  : "unknown-season";
              const resolvedDivision =
                typeof division === "string" && division.trim() !== ""
                  ? division
                  : typeof schedule === "string" && schedule.trim() !== ""
                    ? schedule
                    : "unknown-division";

              // PGHL returns all division games in one call, SCAHA returns per-team
              // For PGHL: cache by season:division:scope (no team needed)
              // For SCAHA: cache by season:division:team (legacy behavior)
              const resolvedTeam =
                selectedMcpServer === "pghl"
                  ? "all-teams" // PGHL gets entire division
                  : typeof team === "string" && team.trim() !== ""
                    ? team
                    : typeof team_slug === "string" && team_slug.trim() !== ""
                      ? team_slug
                      : "unknown-team";

              const resolvedDate =
                typeof date === "string" && date.trim() !== ""
                  ? date
                  : undefined;

              // For PGHL, include scope in cache key (current vs full)
              const resolvedScope =
                selectedMcpServer === "pghl" && typeof scope === "string" && scope.trim() !== ""
                  ? scope
                  : undefined;

              const cacheKey = getScheduleCacheKey(
                selectedMcpServer,
                resolvedSeason,
                resolvedDivision,
                resolvedTeam,
                resolvedDate,
                resolvedScope,
              );

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

            // Cache logic for PGHL get_team_schedule tool (iCal-based)
            if (toolName === 'get_team_schedule') {
              const { team_id, season_id } = args ?? {};
              const resolvedTeamId =
                typeof team_id === "string" && team_id.trim() !== ""
                  ? team_id
                  : "unknown-team";
              const resolvedSeasonId =
                typeof season_id === "string" && season_id.trim() !== ""
                  ? season_id
                  : "9486"; // default to 2025-26 season

              const cacheKey = `${selectedMcpServer}:team_schedule:${resolvedSeasonId}:${resolvedTeamId}`;

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

              // Store in cache (24 hour TTL)
              await scheduleCache.set(cacheKey, result);
              console.log(`   💾 Cached: ${cacheKey}`);

              return result;
            }

            // Cache logic for PGHL get_division_schedule tool (iCal-based)
            if (toolName === 'get_division_schedule') {
              const { season_id, division_id, group_by_date } = args ?? {};
              const resolvedSeasonId =
                typeof season_id === "string" && season_id.trim() !== ""
                  ? season_id
                  : "unknown-season";
              const resolvedDivisionId =
                typeof division_id === "string" && division_id.trim() !== ""
                  ? division_id
                  : "all-divisions";

              const cacheKey = `${selectedMcpServer}:division_schedule:${resolvedSeasonId}:${resolvedDivisionId}`;

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

              // Store in cache (24 hour TTL)
              await scheduleCache.set(cacheKey, result);
              console.log(`   💾 Cached: ${cacheKey}`);

              return result;
            }

            // Cache logic for get_team_stats tool
            if (toolName === 'get_team_stats') {
              const { season, division, team_slug } = args ?? {};
              const cacheKey = getTeamStatsCacheKey(
                selectedMcpServer,
                typeof season === "string" && season.trim() !== "" ? season : "unknown-season",
                typeof division === "string" && division.trim() !== "" ? division : "unknown-division",
                typeof team_slug === "string" && team_slug.trim() !== "" ? team_slug : "unknown-team",
              );

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

              // Store in cache (6 hour TTL - stats change more frequently than schedules)
              await scheduleCache.set(cacheKey, result, 6 * 60 * 60 * 1000);
              console.log(`   💾 Cached (6hr TTL): ${cacheKey}`);

              return result;
            }

            // Cache logic for get_player_stats tool
            if (toolName === 'get_player_stats') {
              const { season, division, team_slug, player, category } = args ?? {};
              const playerKey = typeof player?.name === "string" && player.name.trim() !== ""
                ? player.name
                : typeof player?.number === "string" && player.number.trim() !== ""
                  ? player.number
                  : "unknown";
              const cacheKey = getPlayerStatsCacheKey(
                selectedMcpServer,
                typeof season === "string" && season.trim() !== "" ? season : "unknown-season",
                typeof division === "string" && division.trim() !== "" ? division : "unknown-division",
                typeof team_slug === "string" && team_slug.trim() !== "" ? team_slug : "unknown-team",
                playerKey,
              );

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

              // Store in cache (6 hour TTL - stats change more frequently than schedules)
              await scheduleCache.set(cacheKey, result, 6 * 60 * 60 * 1000);
              console.log(`   💾 Cached (6hr TTL): ${cacheKey}`);

              return result;
            }

            // Default: no caching for other tools
            const startTime = Date.now();
            const result = await toolDef.execute(args);
            const elapsed = Date.now() - startTime;
            console.log(`   ⏱️ Tool execution took ${elapsed}ms`);
            console.log(`   Output:`, JSON.stringify(result, null, 2));
            return result;
          },
        },
      ])
    );

    const wrappedTools = {
      ...wrappedMcpTools,
      calculate_travel_times: {
        description:
          "Calculate travel duration, departure time, and wake-up time using Google Routes API and the user's preferences. The venue address will be resolved automatically from the database.",
        inputSchema: travelToolInputSchema,
        execute: async (args: TravelToolArgs): Promise<TravelToolResult> => {
          const { game, timezone, userPreferences: overrides } = args;

          if (!game) {
            return {
              errorMessage:
                "Missing game details for travel time calculation.",
            };
          }

          // Resolve venue address from database
          console.log(`🗺️ Resolving venue: "${game.venue}"`);
          const venueResult = await resolveVenue(game.venue);

          if (!venueResult) {
            console.error(`❌ Venue not found: "${game.venue}"`);
            return {
              errorMessage: `I couldn't find the venue "${game.venue}" in our database. Please check the venue name and try again, or contact support if this venue should be available.`,
            };
          }

          const venueAddress = venueResult.address;
          console.log(`✅ Venue resolved: ${venueResult.canonical_name} → ${venueAddress}`);

          const overridesInput = overrides ?? {};
          const basePreferences =
            normalizedPreferences ??
            normalizePreferences({
              ...DEFAULT_PREFERENCES,
              ...overridesInput,
            });

          const fallbackPrep =
            basePreferences?.prepTimeMinutes ??
            DEFAULT_PREFERENCES.prepTimeMinutes ??
            30;
          const fallbackArrival =
            basePreferences?.arrivalBufferMinutes ??
            DEFAULT_PREFERENCES.arrivalBufferMinutes ??
            60;

          const coerceNumber = (value: unknown, fallback: number): number => {
            const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
          };

          const usePrepOverride =
            overridesInput.prepTimeOverride === true &&
            overridesInput.prepTimeMinutes !== undefined;

          const useArrivalOverride =
            overridesInput.arrivalBufferOverride === true &&
            overridesInput.arrivalBufferMinutes !== undefined;

          const resolvedPreferences = normalizePreferences({
            team: overridesInput.team ?? basePreferences?.team ?? "",
            division: overridesInput.division ?? basePreferences?.division ?? "",
            season:
              overridesInput.season ??
              basePreferences?.season ??
              DEFAULT_PREFERENCES.season ??
              "",
            homeAddress: overridesInput.homeAddress ?? basePreferences?.homeAddress ?? "",
            prepTimeMinutes: usePrepOverride
              ? coerceNumber(overridesInput.prepTimeMinutes, fallbackPrep)
              : fallbackPrep,
            arrivalBufferMinutes: useArrivalOverride
              ? coerceNumber(overridesInput.arrivalBufferMinutes, fallbackArrival)
              : fallbackArrival,
            minWakeUpTime: overridesInput.minWakeUpTime ?? basePreferences?.minWakeUpTime,
          });

          if (!resolvedPreferences?.homeAddress) {
            return { errorMessage: HOME_ADDRESS_REQUIRED_MESSAGE };
          }

          try {
            const calculation = await calculateTravelTimes(
              game,
              resolvedPreferences,
              {
                venueAddress,
                timezone,
              }
            );

            // Track successful Google Routes API call
            const today = new Date().toISOString().split("T")[0];
            trackExternalApiCall("google-routes", true, today).catch((err) =>
              console.error("❌ Failed to track Maps API call:", err)
            );

            return calculation;
          } catch (error) {
            console.error("🗺️ Travel calculation error:", error);

            // Track failed Google Routes API call
            const today = new Date().toISOString().split("T")[0];
            trackExternalApiCall("google-routes", false, today).catch((err) =>
              console.error("❌ Failed to track Maps API error:", err)
            );

            return { errorMessage: TRAVEL_API_ERROR_MESSAGE };
          }
        },
      },
    };

    const result = streamText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      system: systemPrompt,
      messages: modelMessages,
      tools: wrappedTools,
      stopWhen: stepCountIs(20), // Allow complex multi-tool queries (e.g., schedule + 9 travel calculations + response)
      abortSignal: abortController.signal, // T037: Pass abort signal to streamText
      onFinish: async ({ text, toolCalls, toolResults, steps, usage, finishReason }) => {
        console.log(`📊 Stream finished:`);
        console.log(`   Finish reason: ${finishReason || 'unknown'}`);
        console.log(`   Text length: ${text?.length || 0}`);
        console.log(`   Tool calls: ${toolCalls?.length || 0}`);
        console.log(`   Tool results: ${toolResults?.length || 0}`);
        console.log(`   Steps: ${steps?.length || 0}`);

        // T039: Warn if no response after successful tool calls (potential silent failure)
        const hasToolCalls = toolCalls && toolCalls.length > 0;
        const hasResponse = text && text.trim().length > 0;
        if (hasToolCalls && !hasResponse) {
          console.warn(`⚠️ POTENTIAL ISSUE: ${toolCalls.length} tool call(s) succeeded but LLM returned empty response`);
          console.warn(`   Finish reason: ${finishReason}`);
          console.warn(`   This may indicate a problem with the LLM response generation`);
        }

        // Track analytics (non-blocking)
        const today = new Date().toISOString().split("T")[0];

        // Track conversation count
        trackConversation(today).catch((error) =>
          console.error("❌ Conversation tracking failed:", error)
        );

        // Track token usage and calculate cost
        if (usage && usage.inputTokens && usage.outputTokens) {
          const inputTokens = usage.inputTokens;
          const outputTokens = usage.outputTokens;
          const modelName = "gemini-2.5-flash";

          trackTokens(modelName, inputTokens, outputTokens, today).catch(
            (error) => console.error("❌ Token tracking failed:", error)
          );

          // Calculate and log cost
          const pricing = MODEL_PRICING[modelName];
          const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
          const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
          const totalCost = inputCost + outputCost;

          console.log(`💰 Cost estimate:`);
          console.log(`   Input tokens: ${inputTokens.toLocaleString()} ($${inputCost.toFixed(4)})`);
          console.log(`   Output tokens: ${outputTokens.toLocaleString()} ($${outputCost.toFixed(4)})`);
          console.log(`   Total cost: $${totalCost.toFixed(4)}`);
        }

        // Track tool calls
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            trackToolCall(toolCall.toolName, today).catch((error) =>
              console.error(`❌ Tool tracking failed for ${toolCall.toolName}:`, error)
            );
          }
        }

        // Close the MCP client after streaming completes
        // This is critical to avoid "closed client" errors
        console.log(`🔌 Disconnecting ${selectedMcpLabel} MCP client...`);
        await activeMcpClient.disconnect();

        // Clear timeout after successful completion
        clearTimeout(timeoutId);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // T038: Handle timeout/abort error with user-friendly message
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("⏱️ Request aborted due to timeout");
      return new Response(
        JSON.stringify({
          error: "Request took too long",
          message: "The AI is taking longer than expected to respond. This might happen with complex queries. Please try again or simplify your question."
        }),
        {
          status: 504, // Gateway Timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.error("💥 Hockey chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
