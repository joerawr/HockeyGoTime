/**
 * Validation Utilities
 * User input validation and normalization
 */

import type { UserPreferences } from '@/types/preferences';

/**
 * Validate user preferences
 * Returns array of validation error messages (empty if valid)
 *
 * @param prefs User preferences to validate
 * @returns Array of error messages (empty array if valid)
 *
 * @example
 * const errors = validatePreferences({ team: "", ... });
 * // Returns ["Team name is required", ...]
 */
export function validatePreferences(prefs: UserPreferences): string[] {
  const errors: string[] = [];

  // MCP server validation
  if (prefs.mcpServer !== 'scaha' && prefs.mcpServer !== 'pghl') {
    errors.push('Please choose a valid league data source');
  }

  // Team validation
  if (!prefs.team || prefs.team.trim() === '') {
    errors.push('Team name is required');
  }

  // Division validation
  if (!prefs.division || prefs.division.trim() === '') {
    errors.push('Division is required');
  }

  // Season validation (format depends on MCP server)
  if (!prefs.season || prefs.season.trim() === '') {
    errors.push('Season is required');
  } else {
    // Accept flexible formats - we'll normalize in the API layer
    // SCAHA format: YYYY/YY or YY/YY (e.g., "2025/26" or "25/26")
    const schahaFormat = /^\d{2,4}\/\d{2,4}$/;
    // PGHL full format: YYYY-YY [division info] (e.g., "2025-26 12u-19u AA")
    const pghlFullFormat = /^\d{4}-\d{2}\s+.+$/;
    // Universal short format: YYYY/YY (works for both, we'll normalize)
    const universalFormat = /^\d{2,4}\/\d{2,4}$/;

    if (prefs.mcpServer === 'scaha') {
      if (!schahaFormat.test(prefs.season)) {
        errors.push('Season must be in format YYYY/YY (e.g., 2025/26)');
      }
    } else if (prefs.mcpServer === 'pghl') {
      // PGHL accepts either "2025/26" (will normalize) or "2025-26 12u-19u AA" (full format)
      if (!pghlFullFormat.test(prefs.season) && !universalFormat.test(prefs.season)) {
        errors.push('Season must be in format YYYY/YY (e.g., 2025/26) or YYYY-YY [division] (e.g., 2025-26 12u-19u AA)');
      }
    }
  }

  // Home address validation
  if (!prefs.homeAddress || prefs.homeAddress.trim() === '') {
    errors.push('Home address is required');
  }

  // Prep time validation (0-240 minutes)
  if (prefs.prepTimeMinutes < 0 || prefs.prepTimeMinutes > 240) {
    errors.push('Prep time must be between 0 and 240 minutes');
  }

  // Arrival buffer validation (0-120 minutes)
  if (prefs.arrivalBufferMinutes < 0 || prefs.arrivalBufferMinutes > 120) {
    errors.push('Arrival buffer must be between 0 and 120 minutes');
  }

  // Min wake-up time validation (optional, HH:MM format)
  if (prefs.minWakeUpTime) {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(prefs.minWakeUpTime)) {
      errors.push('Min wake-up time must be in HH:MM format (e.g., 06:00)');
    }
  }

  return errors;
}

/**
 * Normalize team name
 * Converts user input to standardized format
 *
 * @param input Raw team name input
 * @returns Normalized team name
 *
 * @example
 * normalizeTeamName("jr kings 1")
 * // Returns "Jr. Kings (1)"
 *
 * normalizeTeamName("JR Kings1")
 * // Returns "Jr. Kings (1)"
 */
export function normalizeTeamName(input: string): string {
  let normalized = input.trim();

  // Handle Jr Kings variations
  normalized = normalized
    .replace(/jr\.?\s*kings/i, 'Jr. Kings')
    .replace(/jr\.?\s*kings\s*(\d)/i, 'Jr. Kings ($1)')
    .replace(/jr\.?\s*kings\((\d)\)/i, 'Jr. Kings ($1)');

  // Handle OC Hockey variations
  normalized = normalized
    .replace(/oc\s*hockey/i, 'OC Hockey')
    .replace(/oc\s*hockey\s*(\d)/i, 'OC Hockey ($1)')
    .replace(/oc\s*hockey\((\d)\)/i, 'OC Hockey ($1)');

  // Add parentheses if number without them
  normalized = normalized.replace(/\s+(\d)$/, ' ($1)');

  // Capitalize first letter of each word
  normalized = normalized
    .split(' ')
    .map(word => {
      if (word.toLowerCase() === 'oc') return 'OC';
      if (word.match(/^\(/)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return normalized;
}

/**
 * Normalize division
 * Converts user input to standardized format (adds "U" for Under)
 *
 * @param input Raw division input
 * @returns Normalized division
 *
 * @example
 * normalizeDivision("14B")
 * // Returns "14U B"
 *
 * normalizeDivision("16AAA")
 * // Returns "16U AAA"
 */
export function normalizeDivision(input: string): string {
  let normalized = input.trim().toUpperCase();

  // Add "U" if missing (e.g., "14B" → "14U B")
  if (/^\d{1,2}[A-Z]+$/.test(normalized)) {
    const ageMatch = normalized.match(/^(\d{1,2})([A-Z]+)$/);
    if (ageMatch) {
      const [, age, tier] = ageMatch;
      normalized = `${age}U ${tier}`;
    }
  }

  // Ensure space between age and tier (e.g., "14UB" → "14U B")
  normalized = normalized.replace(/(\d{1,2}U)([A-Z]+)/, '$1 $2');

  return normalized;
}

/**
 * Normalize season format
 * Converts various formats to standard YYYY/YYYY
 *
 * @param input Raw season input
 * @returns Normalized season string
 *
 * @example
 * normalizeSeason("2025-2026")
 * // Returns "2025/2026"
 *
 * normalizeSeason("25/26")
 * // Returns "2025/2026"
 */
export function normalizeSeason(input: string): string {
  let normalized = input.trim();

  // Convert dash to slash
  normalized = normalized.replace('-', '/');

  // Expand short format (25/26 → 2025/2026)
  const shortMatch = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (shortMatch) {
    const [, year1, year2] = shortMatch;
    normalized = `20${year1}/20${year2}`;
  }

  return normalized;
}
