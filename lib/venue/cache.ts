/**
 * In-Memory Venue Cache
 *
 * Caches all venues and aliases from Supabase with 24-hour TTL.
 * Provides <1ms lookups via multi-key Map indexing.
 */

import { getSupabaseClient } from './client';
import type { Venue, VenueAlias, VenueWithAliases } from './types';

// Module-level cache (persists across requests in same Node process)
let venueCache: Map<string, Venue> | null = null;
let lastRefresh = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get venues from cache, refreshing if TTL expired
 */
export async function getVenuesFromCache(): Promise<Map<string, Venue>> {
  const now = Date.now();

  // Load on first access or if TTL expired
  if (!venueCache || now - lastRefresh > CACHE_TTL) {
    await refreshCache();
  }

  return venueCache!;
}

/**
 * Force refresh cache from Supabase database
 */
export async function refreshCache(): Promise<void> {
  console.log('Refreshing venue cache from database...');

  const supabase = getSupabaseClient();

  const { data: venues, error } = await supabase
    .from('venues')
    .select('*, venue_aliases(*)')
    .order('canonical_name');

  if (error) {
    throw new Error(`Failed to load venues from database: ${error.message}`);
  }

  // Build multi-key index for fast O(1) lookups
  const cache = new Map<string, Venue>();
  let aliasCount = 0;

  venues?.forEach((venueWithAliases: VenueWithAliases) => {
    // Extract the venue without nested aliases for storage
    const venue: Venue = {
      id: venueWithAliases.id,
      canonical_name: venueWithAliases.canonical_name,
      address: venueWithAliases.address,
      place_id: venueWithAliases.place_id,
      created_at: venueWithAliases.created_at,
      updated_at: venueWithAliases.updated_at,
    };

    // Index by UUID
    cache.set(venue.id, venue);

    // Index by canonical name (lowercase for case-insensitive matching)
    cache.set(venue.canonical_name.toLowerCase(), venue);

    // Index by each alias (lowercase)
    venueWithAliases.venue_aliases?.forEach((alias: VenueAlias) => {
      cache.set(alias.alias_text.toLowerCase(), venue);
      aliasCount++;
    });
  });

  venueCache = cache;
  lastRefresh = Date.now();

  console.log(
    `✅ Venue cache refreshed: ${venues?.length || 0} venues, ${aliasCount} aliases`
  );
}
