/**
 * Cache Singleton Instances
 * Global cache instances for schedule and stats data
 */

import { MemoryCacheProvider } from './memory-cache';
import type { ScheduleData } from '@/types/schedule';
import type { TeamStats, PlayerStats } from '@/types/stats';
import type { MCPServerId } from '@/types/preferences';

/**
 * Schedule cache singleton
 * Key format: "schedule:{season}:{division}:{team}"
 * Example: "schedule:2025/2026:14U-B:jr-kings-1"
 */
export const scheduleCache = new MemoryCacheProvider<ScheduleData>();

/**
 * Team stats cache singleton
 * Key format: "team-stats:{season}:{division}:{team}"
 */
export const teamStatsCache = new MemoryCacheProvider<TeamStats>();

/**
 * Player stats cache singleton
 * Key format: "player-stats:{season}:{division}:{team}:{player}"
 */
export const playerStatsCache = new MemoryCacheProvider<PlayerStats>();

/**
 * Utility: Generate cache key for schedule queries
 */
export function getScheduleCacheKey(
  mcpServer: MCPServerId,
  season: string,
  division: string,
  team: string,
  date?: string,
  scope?: string
): string {
  const baseKey = `schedule:${mcpServer}:${season}:${division}:${team}`;
  const withDate = date ? `${baseKey}:${date}` : baseKey;
  return scope ? `${withDate}:${scope}` : withDate;
}

/**
 * Utility: Generate cache key for team stats
 */
export function getTeamStatsCacheKey(
  mcpServer: MCPServerId,
  season: string,
  division: string,
  team: string
): string {
  return `team-stats:${mcpServer}:${season}:${division}:${team}`;
}

/**
 * Utility: Generate cache key for player stats
 */
export function getPlayerStatsCacheKey(
  mcpServer: MCPServerId,
  season: string,
  division: string,
  team: string,
  player: string
): string {
  return `player-stats:${mcpServer}:${season}:${division}:${team}:${player}`;
}
