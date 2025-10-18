/**
 * User Preferences Types
 * Stores user's hockey team, home location, and timing preferences for personalized queries
 */

export type MCPServerId = 'scaha' | 'pghl';
export type PlayerPosition = 'skater' | 'goalie';

export interface UserPreferences {
  // Data Source
  mcpServer: MCPServerId;     // 'scaha' | 'pghl'

  // Team Identity
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Player Information
  playerPosition?: PlayerPosition; // 'skater' | 'goalie', defaults to 'skater'

  // UI Preferences
  darkMode?: boolean;        // Dark mode enabled/disabled, defaults to false

  // Location & Travel
  homeAddress?: string;      // Optional - Full address for geocoding. If traveling, provide hotel name in chat.

  // Timing Preferences
  prepTimeMinutes: number;   // Minutes needed to get ready, default: 30
  arrivalBufferMinutes: number; // Minutes before game time to arrive, default: 60 (coach requirement)

  // Hotel Feature (deferred post-Capstone)
  minWakeUpTime?: string;    // Optional, e.g., "06:00" (24-hour format)
}

/**
 * Default user preferences for new users
 */
export const DEFAULT_PREFERENCES: Partial<UserPreferences> = {
  mcpServer: 'scaha',
  season: '2025/26',  // SCAHA uses slash format: "2025/26" (current season)
  playerPosition: 'skater',  // Default to skater position
  darkMode: false,           // Default to light mode
  prepTimeMinutes: 30,
  arrivalBufferMinutes: 60,
};
