/**
 * Cache Singleton Instances
 * Global cache instances for schedule and stats data
 */

import { MemoryCacheProvider } from './memory-cache';
import type { ScheduleData } from '@/types/schedule';
import type { TeamStats, PlayerStats } from '@/types/stats';

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
  season: string,
  division: string,
  team: string,
  date?: string
): string {
  const baseKey = `schedule:${season}:${division}:${team}`;
  return date ? `${baseKey}:${date}` : baseKey;
}

/**
 * Utility: Generate cache key for team stats
 */
export function getTeamStatsCacheKey(
  season: string,
  division: string,
  team: string
): string {
  return `team-stats:${season}:${division}:${team}`;
}

/**
 * Utility: Generate cache key for player stats
 */
export function getPlayerStatsCacheKey(
  season: string,
  division: string,
  team: string,
  player: string
): string {
  return `player-stats:${season}:${division}:${team}:${player}`;
}
