-- Venue Resolution System Database Schema
-- Feature: 005-simplified-venue-resolution
-- Note: Run this via Supabase Dashboard SQL Editor

-- Create venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  place_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create venue_aliases table
CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, alias_text)
);

-- Create indexes for performance
CREATE INDEX idx_venues_canonical_name_lower ON venues (LOWER(canonical_name));
CREATE INDEX idx_venue_aliases_text_lower ON venue_aliases (LOWER(alias_text));
CREATE INDEX idx_venue_aliases_venue_id ON venue_aliases (venue_id);

-- Optional: Enable Row Level Security (if needed later)
-- ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE venue_aliases ENABLE ROW LEVEL SECURITY;
