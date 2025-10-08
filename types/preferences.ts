/**
 * User Preferences Types
 * Stores user's hockey team, home location, and timing preferences for personalized queries
 */

export interface UserPreferences {
  // Team Identity
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Location & Travel
  homeAddress: string;       // Full address for geocoding, e.g., "123 Main St, Los Angeles, CA 90001"

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
  season: '2025/2026',
  prepTimeMinutes: 30,
  arrivalBufferMinutes: 60,
};
