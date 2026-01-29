# Research Findings: Simplified Venue Resolution System

**Feature**: 005-simplified-venue-resolution
**Date**: 2025-10-13
**Status**: Complete

## Overview

This document resolves all technical unknowns identified in the Phase 0 planning section. Since this is an intentionally simplified design using standard Next.js and Supabase patterns, no external research agents were required. All decisions are based on established best practices.

---

## 1. Supabase Schema Design

### Decision: Use UUIDs with standard foreign keys and no RLS

**Table Definitions**:

```sql
-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  place_id TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('SCAHA', 'PGHL')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue aliases table
CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, alias_text)
);

-- Indexes for fast lookups
CREATE INDEX idx_venues_canonical_name_lower ON venues (LOWER(canonical_name));
CREATE INDEX idx_venues_league ON venues (league);
CREATE INDEX idx_venue_aliases_text_lower ON venue_aliases (LOWER(alias_text));
CREATE INDEX idx_venue_aliases_venue_id ON venue_aliases (venue_id);
```

**Rationale**:
- **UUIDs**: Standard for Supabase, prevents ID conflicts if merging data later
- **UNIQUE on canonical_name**: Prevents duplicate venues
- **UNIQUE on (venue_id, alias_text)**: Prevents duplicate aliases for same venue
- **CHECK constraint on league**: Ensures data integrity (only SCAHA or PGHL)
- **ON DELETE CASCADE**: Deleting a venue removes all its aliases automatically
- **LOWER() indexes**: Fast case-insensitive lookups (standard B-tree, not GIN)
- **No RLS policies**: Simple read-only public access (anon key is fine for MVP)

**Alternatives Considered**:
- **Serial IDs**: Rejected - UUIDs are Supabase default and avoid ID conflicts
- **JSON column for aliases**: Rejected - harder to query, per user request for separate table
- **RLS policies**: Rejected - unnecessary for public read-only data, adds complexity
- **GIN indexes**: Rejected - no fuzzy matching needed, standard B-tree is sufficient

---

## 2. In-Memory Cache Strategy

### Decision: Module-level Map with lazy initialization and check-on-access TTL

**Implementation Pattern**:

```typescript
// lib/venue/cache.ts
import { createClient } from '@supabase/supabase-js';

type Venue = {
  id: string;
  canonical_name: string;
  address: string;
  place_id: string;
  league: 'SCAHA' | 'PGHL';
};

type VenueAlias = {
  id: string;
  venue_id: string;
  alias_text: string;
};

// Module-level cache (persists across requests in same Node process)
let venueCache: Map<string, Venue> | null = null;
let lastRefresh = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getVenuesFromCache(): Promise<Map<string, Venue>> {
  const now = Date.now();

  // Load on first access or if TTL expired
  if (!venueCache || now - lastRefresh > CACHE_TTL) {
    await refreshCache();
  }

  return venueCache!;
}

export async function refreshCache(): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: venues, error } = await supabase
    .from('venues')
    .select('*, venue_aliases(*)')
    .order('canonical_name');

  if (error) throw new Error(`Failed to load venues: ${error.message}`);

  // Build multi-key index
  const cache = new Map<string, Venue>();

  venues?.forEach(venue => {
    // Index by UUID
    cache.set(venue.id, venue);

    // Index by canonical name (lowercase)
    cache.set(venue.canonical_name.toLowerCase(), venue);

    // Index by each alias (lowercase)
    venue.venue_aliases?.forEach((alias: VenueAlias) => {
      cache.set(alias.alias_text.toLowerCase(), venue);
    });
  });

  venueCache = cache;
  lastRefresh = Date.now();
}
```

**Rationale**:
- **Module-level variables**: Persist across requests in serverless function (Vercel keeps warm)
- **Lazy initialization**: Only load on first request (no app startup hook needed)
- **Check-on-access TTL**: Simple, no background jobs required
- **Multi-key indexing**: Fast O(1) lookups by id, canonical name, or any alias
- **All keys lowercase**: Enables case-insensitive matching without per-request normalization

**Thread Safety**:
- **No locks needed**: JavaScript is single-threaded per event loop
- **Serverless functions**: Each Vercel function instance has its own memory
- **Race condition**: If TTL expires during request, worst case is duplicate DB fetch (acceptable)

**Alternatives Considered**:
- **Redis cache**: Rejected - adds infrastructure complexity, overkill for <1MB data
- **Background refresh**: Rejected - requires cron job or separate worker, check-on-access is simpler
- **Per-request instantiation**: Rejected - defeats purpose of caching

---

## 3. CSV Import Format

### Decision: Single CSV with inline aliases (pipe-separated)

**CSV Schema**:

```csv
canonical_name,address,place_id,league,aliases
Toyota Sports Performance Center,"555 N. Monterey Pass Rd, Monterey Park, CA 91755",ChIJ...,SCAHA,TSPC|Toyota Sports Center
Yorba Linda Ice,"22223 Yorba Linda Blvd, Yorba Linda, CA 92887",ChIJ...,SCAHA,Yorba Linda|YL Ice
```

**Import Script Logic**:

```typescript
// scripts/import-venues.ts
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

async function importVenues(csvPath: string) {
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  for (const row of records) {
    // Insert venue (UPSERT to handle duplicates)
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .upsert({
        canonical_name: row.canonical_name,
        address: row.address,
        place_id: row.place_id,
        league: row.league,
      }, { onConflict: 'canonical_name' })
      .select()
      .single();

    if (venueError) {
      console.warn(`⚠️  Skipped ${row.canonical_name}: ${venueError.message}`);
      continue;
    }

    // Insert aliases if present
    if (row.aliases) {
      const aliases = row.aliases.split('|').map((a: string) => a.trim());

      for (const alias of aliases) {
        const { error: aliasError } = await supabase
          .from('venue_aliases')
          .upsert({
            venue_id: venue.id,
            alias_text: alias,
          }, { onConflict: 'venue_id,alias_text' });

        if (aliasError) {
          console.warn(`⚠️  Skipped alias "${alias}": ${aliasError.message}`);
        }
      }
    }

    console.log(`✅ Imported ${row.canonical_name} (${aliases?.length || 0} aliases)`);
  }
}

// Run: pnpm tsx scripts/import-venues.ts venues.csv
importVenues(process.argv[2]);
```

**Rationale**:
- **Single CSV**: Simpler than two files, human-readable
- **Pipe-separated aliases**: Common delimiter, easy to split
- **UPSERT**: Idempotent (can re-run import safely)
- **onConflict handling**: Skips duplicates gracefully
- **Console logging**: Shows progress, warnings for malformed data

**Alternatives Considered**:
- **Separate CSV for aliases**: Rejected - harder to maintain, requires matching IDs
- **JSON format**: Rejected - CSV is simpler for 30 venues
- **Multiple alias columns**: Rejected - not flexible, wastes space

---

## 4. Resolution Matching Logic

### Decision: Exact match first, then first substring match, filtered by league

**Algorithm**:

```typescript
// lib/venue/resolver.ts
import { getVenuesFromCache } from './cache';
import type { Venue } from './types';

export async function resolveVenue(
  input: string,
  league: 'SCAHA' | 'PGHL'
): Promise<Venue | null> {
  const cache = await getVenuesFromCache();
  const normalized = input.toLowerCase().trim();

  // Step 1: Exact match (O(1) via Map)
  const exact = cache.get(normalized);
  if (exact && exact.league === league) {
    return exact;
  }

  // Step 2: Substring match (O(n) but n is small - 200 venues max)
  for (const [key, venue] of cache.entries()) {
    if (venue.league === league && key.includes(normalized)) {
      return venue; // Return first match
    }
  }

  // No match found
  return null;
}
```

**Rationale**:
- **Exact match first**: Fast O(1) lookup for 95%+ of queries
- **Substring fallback**: Handles "Ice" matching "Yorba Linda Ice"
- **First match wins**: Simple, predictable (admin ensures aliases don't overlap)
- **League filtering**: Prevents SCAHA queries matching PGHL venues
- **Case-insensitive**: All cache keys are lowercase
- **Null return**: Lets LLM respond naturally ("I don't have address for that venue")

**Edge Cases**:
- **Multiple substring matches**: Returns first match (admin must avoid ambiguous aliases)
- **Empty input**: Returns null (normalized to empty string, no matches)
- **Whitespace**: Trimmed automatically
- **Special characters**: Preserved (no need to strip punctuation for exact matching)

**Alternatives Considered**:
- **Fuzzy matching (Levenshtein)**: Rejected - overkill, adds dependency and complexity
- **Return multiple matches**: Rejected - complicates LLM handling, exact/substring is sufficient
- **Error on ambiguous**: Rejected - graceful degradation is better UX

---

## 5. Supabase Client Initialization

### Decision: Per-request instantiation (Supabase-js handles connection pooling)

**Pattern**:

```typescript
// lib/venue/client.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return createClient(url, key);
}
```

**Usage**:

```typescript
// In API routes or cache refresh
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('venues').select('*');
```

**Rationale**:
- **No singleton**: `@supabase/supabase-js` internally manages connection pooling
- **Per-request**: Serverless functions are stateless, no benefit to module-level client
- **Environment validation**: Fails fast if env vars missing
- **Simple**: No complex lifecycle management needed

**Connection Pooling**:
- **Supabase-js**: Uses `fetch()` under the hood (HTTP connections)
- **Vercel**: Maintains warm functions with persistent HTTP keep-alive
- **No explicit pooling**: HTTP/2 connection reuse is automatic

**Error Handling**:
- **Missing env vars**: Throw error at client creation (fails during deployment check)
- **Network errors**: Handled at call site (cache refresh logs error, API returns 500)
- **Database unavailable**: Cache serves stale data if within TTL, else returns error

**Alternatives Considered**:
- **Singleton pattern**: Rejected - unnecessary for serverless, Supabase-js handles pooling
- **Lazy singleton**: Rejected - per-request is simpler and equally performant

---

## Summary of Decisions

| Unknown | Decision | Key Rationale |
|---------|----------|---------------|
| **Schema Design** | UUIDs, foreign keys, no RLS | Standard Supabase patterns, public read-only is fine |
| **Cache Strategy** | Module-level Map, lazy init, check-on-access TTL | Simple, performant, no background jobs needed |
| **Import Format** | Single CSV with pipe-separated aliases | Human-readable, easy to maintain |
| **Matching Logic** | Exact then first substring, league-filtered | Fast, predictable, sufficient for use case |
| **Supabase Client** | Per-request instantiation | Serverless-friendly, Supabase-js handles pooling |

**Complexity Assessment**: ~400 lines of code total across 7 files. No external dependencies beyond @supabase/supabase-js and csv-parse.

**Ready for Phase 1**: All unknowns resolved. Proceed to data-model.md and API contracts.
