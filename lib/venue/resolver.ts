/**
 * Venue Resolution Logic
 *
 * Resolves venue names (canonical or aliases) to canonical venue records.
 * Uses exact match first, falls back to substring matching.
 */

import { getVenuesFromCache } from './cache';
import type { Venue } from './types';

/**
 * Resolve a venue name to its canonical venue record
 *
 * @param input - Venue name to resolve (can be canonical name or alias)
 * @returns Venue object if found, null otherwise
 */
export async function resolveVenue(input: string): Promise<Venue | null> {
  const cache = await getVenuesFromCache();
  const normalized = input.toLowerCase().trim();

  // Step 1: Exact match (O(1) via Map)
  const exact = cache.get(normalized);
  if (exact) {
    return exact;
  }

  // Step 2: Substring match (O(n) but n is small - ~40 venues)
  for (const [key, venue] of cache.entries()) {
    if (key.includes(normalized)) {
      return venue; // Return first match
    }
  }

  // No match found
  return null;
}
