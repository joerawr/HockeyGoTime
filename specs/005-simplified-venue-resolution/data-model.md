# Data Model: Simplified Venue Resolution System

**Feature**: 005-simplified-venue-resolution
**Date**: 2025-10-13
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────────────────┐
│          venues                 │
├─────────────────────────────────┤
│ id (UUID, PK)                   │
│ canonical_name (TEXT, UNIQUE)   │
│ address (TEXT)                  │
│ place_id (TEXT)                 │
│ league (TEXT, CHECK)            │◀──┐
│ created_at (TIMESTAMPTZ)        │   │
│ updated_at (TIMESTAMPTZ)        │   │
└─────────────────────────────────┘   │
                                      │ Many-to-One
                                      │
┌─────────────────────────────────┐   │
│       venue_aliases             │   │
├─────────────────────────────────┤   │
│ id (UUID, PK)                   │   │
│ venue_id (UUID, FK) ────────────────┘
│ alias_text (TEXT)               │
│ created_at (TIMESTAMPTZ)        │
│ UNIQUE(venue_id, alias_text)    │
└─────────────────────────────────┘
```

## Entities

### Venue

**Purpose**: Represents a physical hockey rink/facility with canonical information.

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `canonical_name` | TEXT | NOT NULL, UNIQUE | Official venue name (e.g., "Toyota Sports Performance Center") |
| `address` | TEXT | NOT NULL | Full address (e.g., "555 N. Monterey Pass Rd, Monterey Park, CA 91755") |
| `place_id` | TEXT | NOT NULL | Google Place ID for map integration |
| `league` | TEXT | NOT NULL, CHECK (league IN ('SCAHA', 'PGHL')) | League affiliation |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update timestamp |

**Indexes**:
- `idx_venues_canonical_name_lower`: B-tree on `LOWER(canonical_name)` for case-insensitive lookups
- `idx_venues_league`: B-tree on `league` for filtering SCAHA vs PGHL

**Validation Rules**:
- `canonical_name` must be unique (enforced by database)
- `league` must be exactly 'SCAHA' or 'PGHL' (enforced by CHECK constraint)
- All required fields must be non-null

**Business Rules**:
- One venue has exactly one canonical name
- One venue can have zero or more aliases (see venue_aliases)
- Canonical name is used for display in chat responses
- Address is passed to Google Routes API for travel calculations
- Place ID is used for map integration and address validation

---

### Venue Alias

**Purpose**: Represents alternative names for a venue (abbreviations, colloquialisms, historical names).

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `venue_id` | UUID | FOREIGN KEY → venues(id), NOT NULL, ON DELETE CASCADE | Parent venue reference |
| `alias_text` | TEXT | NOT NULL | Alternative venue name (e.g., "TSPC", "Toyota Sports Center") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| UNIQUE | | (venue_id, alias_text) | Prevents duplicate aliases for same venue |

**Indexes**:
- `idx_venue_aliases_text_lower`: B-tree on `LOWER(alias_text)` for case-insensitive lookups
- `idx_venue_aliases_venue_id`: B-tree on `venue_id` for efficient joins

**Validation Rules**:
- `venue_id` must reference an existing venue (enforced by foreign key)
- Same alias cannot be added twice for the same venue (enforced by UNIQUE constraint)
- Different venues CAN have the same alias text (admin must ensure this doesn't cause ambiguity)

**Business Rules**:
- Each alias belongs to exactly one venue (many-to-one relationship)
- Aliases are matched case-insensitively during venue resolution
- When venue is deleted, all its aliases are automatically deleted (CASCADE)
- Aliases enable matching variations like "TSPC" → "Toyota Sports Performance Center"

---

## Relationships

### Venue ← Venue Alias (One-to-Many)

**Type**: One venue has many aliases (0..*)
**Foreign Key**: `venue_aliases.venue_id` → `venues.id`
**Cascade**: ON DELETE CASCADE (deleting venue removes all aliases)

**Query Patterns**:

```sql
-- Get all aliases for a venue
SELECT * FROM venue_aliases WHERE venue_id = $1;

-- Get venue with all its aliases
SELECT v.*, va.alias_text
FROM venues v
LEFT JOIN venue_aliases va ON va.venue_id = v.id
WHERE v.id = $1;

-- Find venue by canonical name or any alias (case-insensitive)
SELECT DISTINCT v.*
FROM venues v
LEFT JOIN venue_aliases va ON va.venue_id = v.id
WHERE LOWER(v.canonical_name) = LOWER($1)
   OR LOWER(va.alias_text) = LOWER($1)
LIMIT 1;
```

---

## State Transitions

**N/A** - This is a static reference data model with no state machine. Venues and aliases are created, optionally updated, and rarely deleted.

---

## Data Volume Estimates

| Entity | Expected Count | Growth Rate |
|--------|----------------|-------------|
| Venues | 100-200 (across both leagues) | 0-5 new venues per year |
| Venue Aliases | 500-1000 (5-10 aliases per venue avg) | Proportional to venues |

**Storage Estimate**:
- Venue record: ~200 bytes (UUID + text fields)
- Alias record: ~100 bytes (UUID + short text)
- Total: ~200KB for 200 venues with 1000 aliases
- **Database usage**: <0.1% of Supabase free tier (500MB)

---

## Migration Strategy

### Initial Setup (via Supabase Dashboard SQL Editor)

```sql
-- Create venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  place_id TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('SCAHA', 'PGHL')),
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
CREATE INDEX idx_venues_league ON venues (league);
CREATE INDEX idx_venue_aliases_text_lower ON venue_aliases (LOWER(alias_text));
CREATE INDEX idx_venue_aliases_venue_id ON venue_aliases (venue_id);

-- Optional: Enable Row Level Security (if needed later)
-- ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE venue_aliases ENABLE ROW LEVEL SECURITY;
```

### Data Import (via import script)

```bash
# Run import script with CSV
pnpm tsx scripts/import-venues.ts data/scaha-venues.csv
```

---

## Type Definitions (TypeScript)

```typescript
// lib/venue/types.ts

export type Venue = {
  id: string;
  canonical_name: string;
  address: string;
  place_id: string;
  league: 'SCAHA' | 'PGHL';
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
```

---

## Example Data

```json
{
  "venues": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "canonical_name": "Toyota Sports Performance Center",
      "address": "555 N. Monterey Pass Rd, Monterey Park, CA 91755",
      "place_id": "ChIJexamplePlaceId123",
      "league": "SCAHA",
      "created_at": "2025-10-13T12:00:00Z",
      "updated_at": "2025-10-13T12:00:00Z"
    }
  ],
  "venue_aliases": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "venue_id": "550e8400-e29b-41d4-a716-446655440000",
      "alias_text": "TSPC",
      "created_at": "2025-10-13T12:00:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "venue_id": "550e8400-e29b-41d4-a716-446655440000",
      "alias_text": "Toyota Sports Center",
      "created_at": "2025-10-13T12:00:00Z"
    }
  ]
}
```

---

## Compliance & Privacy

**Privacy Requirements** (from FR-016):
- ❌ Do NOT log venue queries or user input
- ✅ Only store venue names from public schedules (manual admin entry)
- ✅ No personally identifiable information in database

**Data Retention**:
- Venues: Indefinite (reference data)
- Aliases: Indefinite (reference data)
- No automatic deletion policy needed

**Access Control**:
- Public read access via Supabase anon key (venues and aliases)
- Admin write access via Supabase dashboard (manual)
- No user authentication required for MVP
