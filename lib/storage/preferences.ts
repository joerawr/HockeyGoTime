/**
 * Preferences Storage
 * localStorage wrapper for user preferences (client-side only)
 */

import type { UserPreferences } from '@/types/preferences';
import { DEFAULT_PREFERENCES } from '@/types/preferences';

const STORAGE_KEY = 'hgt-preferences';

/**
 * Preferences Store
 * Client-side localStorage wrapper for user preferences
 * Handles SSR gracefully (returns null on server)
 */
export const PreferencesStore = {
  /**
   * Get user preferences from localStorage
   * @returns UserPreferences object or null if not found or on server
   */
  get(): UserPreferences | null {
    // SSR check - localStorage only available in browser
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const saved = JSON.parse(data) as Partial<UserPreferences>;
      const preferences = {
        ...DEFAULT_PREFERENCES,
        ...saved,
      } as UserPreferences;
      return preferences;
    } catch (error) {
      console.error('Error reading preferences from localStorage:', error);
      return null;
    }
  },

  /**
   * Save user preferences to localStorage
   * @param prefs User preferences to save
   */
  set(prefs: UserPreferences): void {
    // SSR check - localStorage only available in browser
    if (typeof window === 'undefined') return;

    try {
      // Merge with defaults to ensure all fields present
      const prefsWithDefaults = {
        ...DEFAULT_PREFERENCES,
        ...prefs,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsWithDefaults));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  },

  /**
   * Clear user preferences from localStorage
   */
  clear(): void {
    // SSR check - localStorage only available in browser
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing preferences from localStorage:', error);
    }
  },

  /**
   * Check if preferences exist
   * @returns true if preferences are saved, false otherwise
   */
  has(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
      console.error('Error checking preferences in localStorage:', error);
      return false;
    }
  },
};
