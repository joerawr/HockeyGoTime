/**
 * Venue Resolution Types
 *
 * TypeScript types for the simplified venue resolution system.
 */

export type Venue = {
  id: string;
  canonical_name: string;
  address: string;
  place_id: string;
  created_at?: string;
  updated_at?: string;
};

export type VenueAlias = {
  id: string;
  venue_id: string;
  alias_text: string;
  created_at?: string;
};

export type VenueWithAliases = Venue & {
  venue_aliases: VenueAlias[];
};
