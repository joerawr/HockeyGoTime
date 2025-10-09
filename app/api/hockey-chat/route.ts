export const runtime = "nodejs";

import { HOCKEY_SYSTEM_INSTRUCTIONS } from "@/components/agent/hockey-prompt";
import { getSchahaMCPClient } from "@/lib/mcp";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { scheduleCache, getScheduleCacheKey } from "@/lib/cache";
import { calculateTravelTimes } from "@/lib/travel/time-calculator";
import {
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from "@/types/preferences";
import type { TravelCalculation } from "@/types/travel";
import { z } from "zod";

const TRAVEL_API_ERROR_MESSAGE =
  "Sorry the google maps api isn't responding, please use maps.google.com. We'll look into the issue.";
const HOME_ADDRESS_REQUIRED_MESSAGE =
  "I need a home address saved in your preferences to calculate travel times. Please add it and try again.";

function normalizePreferences(raw: any): UserPreferences | null {
  if (!raw) {
    return null;
  }

  const merged = {
    ...DEFAULT_PREFERENCES,
    ...raw,
  };

  if (!merged.homeAddress || typeof merged.homeAddress !== "string") {
    return {
      team: merged.team ?? "",
      division: merged.division ?? "",
      season: merged.season ?? DEFAULT_PREFERENCES.season ?? "",
      homeAddress: "",
      prepTimeMinutes: Number(merged.prepTimeMinutes ?? DEFAULT_PREFERENCES.prepTimeMinutes ?? 30),
      arrivalBufferMinutes: Number(
        merged.arrivalBufferMinutes ?? DEFAULT_PREFERENCES.arrivalBufferMinutes ?? 60
      ),
      minWakeUpTime: merged.minWakeUpTime,
    };
  }

  return {
    team: merged.team ?? "",
    division: merged.division ?? "",
    season: merged.season ?? DEFAULT_PREFERENCES.season ?? "",
    homeAddress: merged.homeAddress,
    prepTimeMinutes: Number(merged.prepTimeMinutes ?? DEFAULT_PREFERENCES.prepTimeMinutes ?? 30),
    arrivalBufferMinutes: Number(
      merged.arrivalBufferMinutes ?? DEFAULT_PREFERENCES.arrivalBufferMinutes ?? 60
    ),
    minWakeUpTime: merged.minWakeUpTime,
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
  venueAddress: z.string(),
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
  try {
    const { messages, preferences } = await request.json();
    const normalizedPreferences = normalizePreferences(preferences);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 });
    }

    // Convert UIMessages to ModelMessages
    const modelMessages = convertToModelMessages(messages);

    // Build system prompt with user preferences context
    const promptPreference = {
      team:
        normalizedPreferences?.team ??
        preferences?.team ??
        "not set",
      division:
        normalizedPreferences?.division ??
        preferences?.division ??
        "not set",
      season:
        normalizedPreferences?.season ??
        preferences?.season ??
        "not set",
      homeAddress:
        normalizedPreferences?.homeAddress ??
        preferences?.homeAddress ??
        "not set",
    };

    let systemPrompt = HOCKEY_SYSTEM_INSTRUCTIONS;
    systemPrompt = systemPrompt
      .replace("{userTeam}", promptPreference.team)
      .replace("{userDivision}", promptPreference.division)
      .replace("{userSeason}", promptPreference.season)
      .replace("{userHomeAddress}", promptPreference.homeAddress);

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

            // Cache logic for get_team_stats tool
            if (toolName === 'get_team_stats') {
              const { season, division, team_slug } = args;
              const cacheKey = `team_stats:${season}:${division}:${team_slug}`;

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
              const { season, division, team_slug, player, category } = args;
              const playerKey = player?.name || player?.number || 'unknown';
              const cacheKey = `player_stats:${season}:${division}:${team_slug}:${playerKey}:${category || 'skater'}`;

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
          "Calculate travel duration, departure time, and wake-up time using Google Routes API and the user's preferences.",
        inputSchema: travelToolInputSchema,
        execute: async (args: TravelToolArgs): Promise<TravelToolResult> => {
          const { game, venueAddress, timezone, userPreferences: overrides } = args;

          if (!game || !venueAddress) {
            return {
              errorMessage:
                "Missing game details or venue address for travel time calculation.",
            };
          }

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

            return calculation;
          } catch (error) {
            console.error("🗺️ Travel calculation error:", error);
            return { errorMessage: TRAVEL_API_ERROR_MESSAGE };
          }
        },
      },
    };

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
