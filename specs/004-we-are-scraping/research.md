# Research: Venue Resolution System

## Supabase pg_trgm Implementation

### Executive Summary

PostgreSQL's `pg_trgm` extension provides trigram-based fuzzy text matching that's ideal for venue name resolution at 100-200 venue scale. Trigram matching works by breaking strings into groups of three consecutive characters and measuring similarity based on shared trigrams. This approach handles typos, abbreviations, and variations effectively without requiring language-specific processing (unlike full-text search).

**Key Decision**: Use `pg_trgm` with GIN indexes over full-text search because:
- Better for short string matching (venue names, not documents)
- No language/stemming requirements (proper nouns)
- Handles middle-of-string matches ("Yorba" → "Yorba Linda ICE")
- Simple threshold-based confidence scoring (0.0-1.0)
- Excellent performance at 100-200 venue scale

### Enabling pg_trgm in Supabase

The `pg_trgm` extension is pre-installed in Supabase. Enable it via SQL Editor:

```sql
-- Enable the extension (one-time setup)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Or enable via the Supabase Dashboard:
1. Navigate to Database > Extensions
2. Search for "pg_trgm"
3. Click "Enable"

### Schema Design

#### Recommended Tables

**venues table** (canonical venue records):
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL, -- lowercase, trimmed, no special chars
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  metadata JSONB, -- store rink count, facility type, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for fuzzy matching on normalized name
CREATE INDEX venues_normalized_name_trgm_idx
  ON venues
  USING GIN (normalized_name gin_trgm_ops);

-- Regular index for exact lookups
CREATE INDEX venues_canonical_name_idx
  ON venues (canonical_name);
```

**venue_aliases table** (handle variations like "TSPC", "Toyota Center", etc.):
```sql
CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL, -- lowercase, trimmed
  alias_type TEXT, -- 'abbreviation', 'common_name', 'historical', 'typo'
  confidence NUMERIC(3, 2) DEFAULT 1.0, -- for ranking aliases
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, normalized_alias)
);

-- GIN index for fuzzy matching on aliases
CREATE INDEX venue_aliases_normalized_alias_trgm_idx
  ON venue_aliases
  USING GIN (normalized_alias gin_trgm_ops);

-- Index for venue lookups
CREATE INDEX venue_aliases_venue_id_idx
  ON venue_aliases (venue_id);
```

#### Schema Design Rationale

1. **Separate canonical vs normalized columns**: Keep original names for display, use normalized for matching
2. **Separate aliases table**: Allows multiple variations per venue without denormalization
3. **JSONB metadata**: Flexibility for venue-specific attributes (rink names, parking info, etc.)
4. **Confidence scoring on aliases**: Prioritize better matches ("TSPC" higher confidence than "Toyota")
5. **Cascade deletes**: Maintain referential integrity
6. **UUID primary keys**: Better for distributed systems and migrations

#### Normalization Function

Create a reusable normalization function:

```sql
CREATE OR REPLACE FUNCTION normalize_venue_name(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(input, '[^a-zA-Z0-9\s]', '', 'g'), -- remove special chars
        '\s+', ' ', 'g' -- collapse multiple spaces
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Index Configuration

#### GIN vs GiST Index Trade-offs

| Aspect | GIN | GiST |
|--------|-----|------|
| **Search speed** | Faster | Slower |
| **Build speed** | Slower | Faster |
| **Update speed** | Slower | Faster |
| **Index size** | Larger | Smaller |
| **Best for** | Static/read-heavy data | Frequently updated data |

**Recommendation**: Use **GIN indexes** for this use case because:
- Venues are relatively static (100-200 records, infrequent updates)
- Search performance is critical (user-facing queries)
- Index build time is one-time cost
- Modern PostgreSQL (12+) has improved GIN update performance

#### Creating GIN Indexes

```sql
-- Main venue name index
CREATE INDEX venues_normalized_name_trgm_idx
  ON venues
  USING GIN (normalized_name gin_trgm_ops);

-- Alias index
CREATE INDEX venue_aliases_normalized_alias_trgm_idx
  ON venue_aliases
  USING GIN (normalized_alias gin_trgm_ops);

-- Optional: Composite index for filtered searches
CREATE INDEX venue_aliases_venue_id_normalized_alias_trgm_idx
  ON venue_aliases
  USING GIN (venue_id, normalized_alias gin_trgm_ops);
```

### Query Patterns

#### Pattern 1: Direct Similarity Search with Threshold

Search using the `similarity()` function with 0.7 threshold:

```sql
-- Search venues directly
SELECT
  id,
  canonical_name,
  normalized_name,
  similarity(normalized_name, normalize_venue_name('TSPC')) AS score
FROM venues
WHERE similarity(normalized_name, normalize_venue_name('TSPC')) > 0.7
ORDER BY score DESC
LIMIT 5;
```

#### Pattern 2: Combined Venue + Alias Search

Search both canonical names and aliases:

```sql
-- Search both venues and aliases
WITH venue_matches AS (
  SELECT
    id,
    canonical_name,
    similarity(normalized_name, normalize_venue_name($1)) AS score,
    'canonical' AS match_type
  FROM venues
  WHERE similarity(normalized_name, normalize_venue_name($1)) > 0.7
),
alias_matches AS (
  SELECT
    v.id,
    v.canonical_name,
    similarity(va.normalized_alias, normalize_venue_name($1)) * va.confidence AS score,
    'alias' AS match_type
  FROM venue_aliases va
  JOIN venues v ON va.venue_id = v.id
  WHERE similarity(va.normalized_alias, normalize_venue_name($1)) > 0.7
)
SELECT * FROM venue_matches
UNION ALL
SELECT * FROM alias_matches
ORDER BY score DESC
LIMIT 5;
```

#### Pattern 3: Operator-Based Search (Uses Index Better)

Use the `%` similarity operator for better index utilization:

```sql
-- Using % operator (threshold set via set_limit or pg_trgm.similarity_threshold)
SET pg_trgm.similarity_threshold = 0.7;

SELECT
  v.id,
  v.canonical_name,
  similarity(v.normalized_name, normalize_venue_name($1)) AS score
FROM venues v
WHERE v.normalized_name % normalize_venue_name($1)
ORDER BY score DESC
LIMIT 5;
```

#### Pattern 4: Word Similarity for Substring Matching

Use `word_similarity()` when the query is shorter than the target:

```sql
-- Better for "Yorba" matching "Yorba Linda ICE"
SELECT
  id,
  canonical_name,
  word_similarity($1, normalized_name) AS score
FROM venues
WHERE $1 <% normalized_name -- word_similarity operator
ORDER BY score DESC
LIMIT 5;
```

#### Pattern 5: Database Function for Easy Integration

Create a reusable function:

```sql
CREATE OR REPLACE FUNCTION find_venues_fuzzy(
  search_term TEXT,
  threshold NUMERIC DEFAULT 0.7,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE(
  venue_id UUID,
  canonical_name TEXT,
  match_score NUMERIC,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH venue_matches AS (
    SELECT
      v.id,
      v.canonical_name,
      similarity(v.normalized_name, normalize_venue_name(search_term)) AS score,
      'canonical'::TEXT AS type
    FROM venues v
    WHERE similarity(v.normalized_name, normalize_venue_name(search_term)) > threshold
  ),
  alias_matches AS (
    SELECT
      v.id,
      v.canonical_name,
      similarity(va.normalized_alias, normalize_venue_name(search_term)) * va.confidence AS score,
      'alias'::TEXT AS type
    FROM venue_aliases va
    JOIN venues v ON va.venue_id = v.id
    WHERE similarity(va.normalized_alias, normalize_venue_name(search_term)) > threshold
  )
  SELECT * FROM venue_matches
  UNION ALL
  SELECT * FROM alias_matches
  ORDER BY score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage:
SELECT * FROM find_venues_fuzzy('TSPC', 0.7, 5);
```

### Threshold Tuning Best Practices

#### Understanding the 0.7 Threshold

- **Default threshold**: 0.3 (very permissive, many hits)
- **Your threshold**: 0.7 (strict, high-quality matches)
- **Range**: 0.0 (match everything) to 1.0 (exact match only)

#### Threshold Guidelines

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| 0.3-0.4 | Very permissive | Broad search, lots of results |
| 0.5-0.6 | Moderate | Balance precision/recall |
| 0.7-0.8 | Strict | High-quality matches only |
| 0.9-1.0 | Near-exact | Typo tolerance only |

#### Setting Thresholds

**Global session setting**:
```sql
SET pg_trgm.similarity_threshold = 0.7;
```

**Per-query setting** (recommended):
```sql
-- Use in WHERE clause with explicit function call
WHERE similarity(col, query) > 0.7
```

**Dynamic thresholds**:
```sql
-- Try strict first, fall back to relaxed
WITH strict_matches AS (
  SELECT * FROM venues
  WHERE similarity(normalized_name, 'search') > 0.7
)
SELECT * FROM strict_matches
UNION ALL
SELECT * FROM venues
WHERE similarity(normalized_name, 'search') > 0.5
  AND NOT EXISTS (SELECT 1 FROM strict_matches)
LIMIT 5;
```

#### Tuning Recommendations

1. **Start with 0.7**: Good balance for venue names
2. **Monitor false negatives**: If legitimate matches are missed, lower threshold
3. **A/B test with real data**: Log queries and manual validation
4. **Consider query length**: Shorter queries may need lower threshold
5. **Combine with other signals**: Use address, city, or league data for disambiguation

### Performance Characteristics at 100-200 Venue Scale

#### Expected Performance

| Operation | Estimated Time | Notes |
|-----------|----------------|-------|
| Single venue lookup | < 5ms | With GIN index |
| Fuzzy search (top 5) | 5-20ms | Depends on threshold |
| Alias + venue search | 10-30ms | Two index scans |
| Bulk insert (200 venues) | 100-500ms | One-time operation |
| Index creation | 50-200ms | One-time operation |

#### Scaling Considerations

At 100-200 venues with 500-1000 aliases:
- **Total data size**: < 1 MB (negligible)
- **Index size**: 1-5 MB (easily fits in memory)
- **Query performance**: Sub-second for all operations
- **Concurrent users**: Handles 100s of concurrent queries easily
- **No optimization needed**: Scale is trivial for PostgreSQL

#### Performance Optimization Tips

1. **Use GIN indexes** (done above)
2. **Normalize in application layer**: Pre-normalize search terms before querying
3. **Cache common queries**: 80% of queries likely hit same 20 venues
4. **Use EXPLAIN ANALYZE**: Verify index usage
5. **Adjust work_mem if needed**: Default 4MB likely sufficient

Example EXPLAIN ANALYZE:
```sql
EXPLAIN ANALYZE
SELECT * FROM venues
WHERE similarity(normalized_name, 'toyota') > 0.7
ORDER BY similarity(normalized_name, 'toyota') DESC
LIMIT 5;
```

Look for "Index Scan using venues_normalized_name_trgm_idx" in output.

### Alternative Approaches Considered

#### 1. Full-Text Search (tsvector/tsquery)

**Pros**:
- Built into PostgreSQL
- Fast for document search
- Language-aware stemming

**Cons**:
- Designed for documents, not short strings
- Requires language dictionaries
- No similarity scoring out of box
- Overkill for venue names
- Doesn't handle middle-of-string well

**Verdict**: ❌ Not recommended for venue names

#### 2. Levenshtein Distance (fuzzystrmatch extension)

**Pros**:
- Exact edit distance calculation
- Good for typo detection

**Cons**:
- Slower than trigram (O(n*m) complexity)
- No native index support
- Less forgiving than trigram for abbreviations

**Verdict**: ⚠️ Use as secondary filter, not primary

Example combined approach:
```sql
SELECT * FROM venues
WHERE similarity(normalized_name, 'search') > 0.7
  AND levenshtein(normalized_name, 'search') < 5
ORDER BY similarity(normalized_name, 'search') DESC;
```

#### 3. Exact Matching with Many Aliases

**Pros**:
- Predictable behavior
- Fast exact lookups

**Cons**:
- Requires exhaustive alias enumeration
- Doesn't handle new variations
- Maintenance burden (1000s of aliases needed)

**Verdict**: ❌ Not scalable

#### 4. External Search Services (Elasticsearch, Algolia)

**Pros**:
- Advanced features (faceting, geo-search)
- Excellent scaling
- Managed service options

**Cons**:
- Overkill for 200 venues
- Additional infrastructure
- Cost ($50-500/month)
- Sync complexity

**Verdict**: ❌ Over-engineered for this scale

#### 5. Soundex/Metaphone (Phonetic Matching)

**Pros**:
- Handles pronunciation variations
- Good for names

**Cons**:
- Not useful for abbreviations ("TSPC" phonetically different from "Toyota")
- Less effective for proper nouns
- Still requires trigram for typos

**Verdict**: ⚠️ Could complement trigram for user-entered names

### Recommended Approach: pg_trgm + GIN + Smart Schema

**Why this wins**:
1. ✅ Native PostgreSQL (no external dependencies)
2. ✅ Excellent performance at target scale
3. ✅ Handles typos, abbreviations, and variations
4. ✅ Simple to implement and maintain
5. ✅ Works in Supabase out of box
6. ✅ Flexible threshold tuning
7. ✅ Can combine with other signals (geo, league)

### Sample Data and Queries

#### Sample Venue Data

```sql
-- Insert sample venues
INSERT INTO venues (canonical_name, normalized_name, city, state) VALUES
  ('Toyota Sports Performance Center', normalize_venue_name('Toyota Sports Performance Center'), 'El Segundo', 'CA'),
  ('Yorba Linda ICE', normalize_venue_name('Yorba Linda ICE'), 'Yorba Linda', 'CA'),
  ('Great Park Ice & FivePoint Arena', normalize_venue_name('Great Park Ice & FivePoint Arena'), 'Irvine', 'CA'),
  ('Anaheim ICE', normalize_venue_name('Anaheim ICE'), 'Anaheim', 'CA');

-- Insert sample aliases
INSERT INTO venue_aliases (venue_id, alias, normalized_alias, alias_type, confidence)
SELECT
  v.id,
  a.alias,
  normalize_venue_name(a.alias),
  a.type,
  a.conf
FROM venues v
CROSS JOIN LATERAL (
  VALUES
    ('TSPC', 'abbreviation', 0.95),
    ('Toyota Center', 'common_name', 0.85),
    ('Toyota Sports Center', 'common_name', 0.80),
    ('El Segundo Rink', 'location_based', 0.70)
) AS a(alias, type, conf)
WHERE v.canonical_name = 'Toyota Sports Performance Center';
```

#### Test Queries

```sql
-- Test 1: Abbreviation match
SELECT * FROM find_venues_fuzzy('TSPC', 0.7);
-- Expected: Toyota Sports Performance Center (score ~0.95)

-- Test 2: Partial name
SELECT * FROM find_venues_fuzzy('Yorba', 0.7);
-- Expected: Yorba Linda ICE (score ~0.75-0.85)

-- Test 3: Typo
SELECT * FROM find_venues_fuzzy('Anahiem Ice', 0.7);
-- Expected: Anaheim ICE (score ~0.70-0.80)

-- Test 4: Common variation
SELECT * FROM find_venues_fuzzy('Great Park', 0.7);
-- Expected: Great Park Ice & FivePoint Arena (score ~0.70-0.80)
```

### Implementation Checklist

- [ ] Enable pg_trgm extension in Supabase
- [ ] Create venues table with normalized_name column
- [ ] Create venue_aliases table
- [ ] Create normalize_venue_name() function
- [ ] Create GIN indexes on both tables
- [ ] Create find_venues_fuzzy() function
- [ ] Insert initial venue data (100-200 venues)
- [ ] Generate common aliases for top venues (TSPC, Yorba, etc.)
- [ ] Test with real SCAHA venue data
- [ ] Benchmark query performance with EXPLAIN ANALYZE
- [ ] Tune threshold based on false positive/negative rate
- [ ] Add caching layer for frequent queries
- [ ] Document known aliases and edge cases
- [ ] Set up monitoring for slow queries

### References

- [PostgreSQL pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Supabase Extensions](https://supabase.com/docs/guides/database/extensions)
- [pg_trgm Performance Best Practices](https://mazeez.dev/posts/pg-trgm-similarity-search-and-fast-like)
- [Fuzzy Name Matching in Postgres - Crunchy Data](https://www.crunchydata.com/blog/fuzzy-name-matching-in-postgresql)
- [Full Text Search vs Trigrams](https://www.aapelivuorinen.com/blog/2021/02/24/postgres-text-search/)

### Next Steps

1. **Prototype in Supabase**: Create dev database with sample data
2. **Gather real venue data**: Extract all unique venues from SCAHA schedules
3. **Build alias dataset**: Document common abbreviations and variations
4. **Integration with HGT**: Add venue resolution to existing schedule tools
5. **User feedback loop**: Log queries that fail to match for alias refinement

---

## Venue Name Normalization Rules

### Overview

Before fuzzy matching venue names, deterministic normalization rules must be applied to standardize text. This research defines comprehensive rules for normalizing ice hockey venue names based on industry patterns, postal standards, and actual SCAHA/PGHL venue examples.

### Real-World SCAHA Venue Examples

The following venues are actively used in SCAHA schedules (2025-26 season):

- Ice Realm, Iceoplex - Simi Valley, The Rinks - Yorba Linda, The Rinks - Lakewood, The Rinks - Anaheim
- Lake Forest Ice Palace, Pickwick Ice Arena, LA Kings Icetown Riverside, KHS Ice Arena
- The Cube Santa Clarita, Ice in Paradise, Great Park Ice & Fivepoint Arena
- Aliso Viejo Ice, Anaheim ICE, Bakersfield Ice Sports, Berger Foundation Iceplex
- Carlsbad Ice Center, East West Ice, Glacier Falls FSC (uses Anaheim ICE)
- Toyota Sports Performance Center, Valley Center Ice / LA Kings Valley Ice Center
- Yorba Linda ICE (YLICE), Ontario Center Ice, Paramount Ice Land, Poway Ice Arena
- SD Ice Arena, Skating Edge Harbor City, UTC La Jolla, Kroc Center, Mammoth Lakes

### Common Venue Naming Patterns

From the SCAHA examples, several patterns emerge:

1. **Multi-venue chains**: "The Rinks - [Location]" (Yorba Linda, Lakewood, Anaheim)
2. **Sponsor prefixes**: "LA Kings [Venue Name]", "Berger Foundation [Type]"
3. **Location-based names**: "[City] Ice [Type]" or "[City] [Type]"
4. **Branded facilities**: "Toyota Sports Performance Center", "The Cube Santa Clarita"
5. **Descriptive names**: "Ice in Paradise", "Great Park Ice & Fivepoint Arena"
6. **Abbreviations in official names**: "ICE" (uppercase), "IP" for Ice Palace, "FSC" for Figure Skating Club

---

## Normalization Rules (Order Matters!)

Apply these transformations in sequence. Order of operations is critical to prevent information loss.

### 1. Preserve Key Context First

Before any destructive operations, identify and preserve important context:

```typescript
// Extract and store rink/sheet identifiers
const rinkMatch = text.match(/\b(rink|sheet|pad|ice)\s*([A-Z0-9]|[0-9]+)\b/i);
// Result: "Rink 2", "Sheet A", "Ice 1"

// Extract and store year context (may indicate temporary or seasonal venues)
const yearMatch = text.match(/\b(19|20)\d{2}\b/);
```

### 2. Case Normalization

Convert to lowercase for consistent comparison:

```typescript
normalized = text.toLowerCase();
// "Great Park Ice & Fivepoint Arena" → "great park ice & fivepoint arena"
```

### 3. Whitespace Normalization

Clean up spacing:

```typescript
// Replace tabs and multiple spaces with single space
normalized = normalized.replace(/\s+/g, ' ').trim();
// "Ice  Realm   " → "ice realm"
```

### 4. Remove Noise Characters

Remove characters that don't contribute to venue identity:

```typescript
// Remove emojis, special unicode
normalized = normalized.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

// Remove common noise patterns
normalized = normalized.replace(/[\(\)]/g, ''); // Remove parentheses
normalized = normalized.replace(/[\/\\]/g, ' '); // Replace slashes with spaces
// "Ice (Rink 2025)" → "ice rink 2025"
```

### 5. Expand Common Abbreviations

Standardize abbreviated terms (BEFORE punctuation removal to preserve context):

**Facility Type Abbreviations:**
```typescript
const facilityAbbreviations = {
  'ice rnk': 'ice rink', 'ice sk': 'ice skating', 'rnk': 'rink',
  'ctr': 'center', 'cntr': 'center', 'centre': 'center',
  'cmplx': 'complex', 'fac': 'facility', 'splex': 'plex',
  'ip': 'ice palace', 'fsc': 'figure skating club',
};
```

**Compass Directions (USPS Standards):**
```typescript
const compassDirections = {
  'north': 'n', 'south': 's', 'east': 'e', 'west': 'w',
  'northeast': 'ne', 'northwest': 'nw', 'southeast': 'se', 'southwest': 'sw',
};
```

### 6. Standardize Sponsor Names

Common sponsor variations:

```typescript
const sponsorVariations = {
  'tspc': 'toyota sports center',
  'toyota sport center': 'toyota sports center',
  'toyota sports performance center': 'toyota sports center',
  'lak': 'la kings', 'los angeles kings': 'la kings',
  'ylice': 'yorba linda ice', 'gpi': 'great park ice',
};
```

### 7-10. Final Cleanup

- Remove punctuation: `[.,;:!?'"&-]`
- Collapse spaces again
- Remove stop words: `['the', 'a', 'an', 'at', 'in', 'on']`
- Reattach rink identifier if extracted

---

## Rink/Sheet Identifier Patterns

### Common Patterns

**Numeric**: "Rink 1", "Rink 2", "Ice 1"
**Letter**: "Sheet A", "Sheet B", "Rink A"
**Named**: "Summerlin Hospital Rink" (City National Arena Rink 1)

### Extraction Strategy

```typescript
const rinkIdentifierPattern = /\b(rink|sheet|pad|ice|arena)\s*([A-Z0-9]|[0-9]+)\b/i;
```

Store separately from venue name for flexible matching (allows "Ice Realm Rink 1" and "Ice Realm Rink 2" to both match "ice realm").

---

## Edge Cases

1. **Same venue, different spellings**: "Yorba Linda ICE" vs "YLICE" → Aliases + fuzzy matching
2. **Similar names, different locations**: "Ontario Ice Center" (CA) vs (Canada) → Include city/state, map disambiguation
3. **Sponsor name changes**: Historical alias records preserve old names
4. **Venue chains**: "The Rinks - Yorba Linda" → Location is critical, separate canonical venues
5. **Typos**: pg_trgm catches most, admin review for low-confidence

---

## TypeScript Implementation

```typescript
export function normalizeVenueName(rawVenueName: string): {
  normalized: string;
  rinkIdentifier?: string;
  yearContext?: string;
} {
  // Step 1: Preserve context
  const rinkMatch = rawVenueName.match(/\b(rink|sheet|pad|ice|arena)\s*([A-Z0-9]|[0-9]+)\b/i);
  const rinkIdentifier = rinkMatch ? `rink ${rinkMatch[2].toLowerCase()}` : undefined;
  const yearMatch = rawVenueName.match(/\b(19|20)\d{2}\b/);
  const yearContext = yearMatch ? yearMatch[0] : undefined;

  let normalized = rawVenueName.toLowerCase();
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  normalized = normalized.replace(/[\(\)]/g, '').replace(/[\/\\]/g, ' ');

  // Expand abbreviations
  const abbreviations: Record<string, string> = {
    'ice rnk': 'ice rink', 'rnk': 'rink', 'ctr': 'center', 'centre': 'center',
    'ip': 'ice palace', 'fsc': 'figure skating club',
    'north': 'n', 'south': 's', 'east': 'e', 'west': 'w',
  };
  for (const [abbrev, full] of Object.entries(abbreviations)) {
    normalized = normalized.replace(new RegExp(`\\b${abbrev}\\b`, 'g'), full);
  }

  // Sponsor variations
  const sponsors: Record<string, string> = {
    'tspc': 'toyota sports center',
    'toyota sports performance center': 'toyota sports center',
    'ylice': 'yorba linda ice',
  };
  for (const [variant, canonical] of Object.entries(sponsors)) {
    if (normalized.includes(variant)) {
      normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), canonical);
    }
  }

  normalized = normalized.replace(/[.,;:!?'"&-]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  const stopWords = ['the', 'a', 'an', 'at', 'in', 'on'];
  const words = normalized.split(' ').filter(word => !stopWords.includes(word));
  normalized = words.join(' ');

  return { normalized, rinkIdentifier, yearContext };
}
```

---

## Testing Strategy

```typescript
describe('normalizeVenueName', () => {
  it('normalizes SCAHA variations', () => {
    expect(normalizeVenueName('Great Park Ice & Fivepoint Arena').normalized)
      .toBe('great park ice fivepoint arena');
    expect(normalizeVenueName('TSPC').normalized)
      .toBe('toyota sports center');
    expect(normalizeVenueName('YLICE').normalized)
      .toBe('yorba linda ice');
  });

  it('extracts rink identifiers', () => {
    expect(normalizeVenueName('Great Park Ice (Rink 1)').rinkIdentifier)
      .toBe('rink 1');
  });
});
```

---

## Performance & Caching

- Normalization: < 1ms per name (stateless, fast)
- Cache normalized results in-memory (24-hour TTL)
- Fuzzy matching with indexes: < 50ms

```typescript
const normalizationCache = new Map<string, NormalizedResult>();
export function cachedNormalize(raw: string): NormalizedResult {
  if (normalizationCache.has(raw)) return normalizationCache.get(raw)!;
  const result = normalizeVenueName(raw);
  normalizationCache.set(raw, result);
  return result;
}
```

---

## Decision Summary

| Decision | Rationale |
|----------|-----------|
| Deterministic rule-based normalization | Fast, explainable, deterministic (FR-014) |
| Specific transformation order | Prevents information loss |
| Separate rink identifier storage | Flexible venue-level vs rink-level matching |
| pg_trgm for fuzzy matching | Handles typos, reordering, abbreviations |
| Admin review < 0.7 confidence | Human oversight for quality |

---

## References

- USPS Address Standards: https://pe.usps.com/text/pub28/28c2_014.htm
- Text Normalization: https://towardsdatascience.com/text-normalization-7ecc8e084e31
- Fuzzy Matching: https://www.boardflare.com/tasks/nlp/fuzzy-match
- SCAHA Venues: https://www.scaha.net/scaha/

---

**Venue Normalization Research Status**: Complete
**Next Research Topic**: Google Places API Integration

---

## Google Places API Integration

### Executive Summary

For geocoding venue names from scraped hockey schedules (e.g., "Great Park Ice" to full address + Place ID), the **Google Places API New Text Search** endpoint is the recommended approach. It provides venue-specific search capabilities with confidence signals through result ranking, though it requires careful cost management through field masking.

### 1. API Endpoint Recommendation

**Recommended: Places API New Text Search**

**Endpoint**: `https://places.googleapis.com/v1/places:searchText`

**Why Text Search over Geocoding API:**
- **Geocoding API** converts complete addresses to coordinates but is NOT designed for venue name searches
- **Text Search API** is purpose-built for finding establishments and POIs by name
- Text Search handles partial names, business names, and location types (like "ice rink")
- Returns comprehensive venue data beyond coordinates (hours, ratings, photos, etc.)

**Alternative: Find Place from Text (Legacy)**
- Older endpoint but still supported
- Uses GET with query parameters instead of POST with JSON
- Pattern: `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`
- Consider for simpler implementations, but New API is recommended

**Key Decision**: Use Text Search over Place Details for initial venue discovery. Place Details requires a known place_id, which you don't have yet. Once you have a place_id, cache it and use Place Details for updates (cheaper than repeated Text Search calls).

### 2. Sample Request/Response Patterns

#### Text Search Request (New API)

```bash
curl -X POST https://places.googleapis.com/v1/places:searchText \
  -H 'Content-Type: application/json' \
  -H 'X-Goog-Api-Key: YOUR_API_KEY' \
  -H 'X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location' \
  -d '{
    "textQuery": "Great Park Ice Irvine CA",
    "includedType": "gym",
    "locationBias": {
      "circle": {
        "center": {
          "latitude": 33.6846,
          "longitude": -117.8265
        },
        "radius": 50000.0
      }
    }
  }'
```

**Key Parameters:**
- `textQuery`: Venue name + city/state for disambiguation
- `includedType`: Use `"gym"` or `"establishment"` for sports facilities (no specific "ice_rink" type exists)
- `locationBias`: Circle with SCAHA region center (Orange County, CA) to prioritize local results
- `FieldMask` header: Critical for cost control (see section 4)

#### Sample Response Structure

```json
{
  "places": [
    {
      "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "displayName": {
        "text": "Great Park Ice & FivePoint Arena",
        "languageCode": "en"
      },
      "formattedAddress": "888 Ridge Valley, Irvine, CA 92618, USA",
      "location": {
        "latitude": 33.68458,
        "longitude": -117.82647
      }
    }
  ]
}
```

**Important Response Fields:**
- `places.id`: Store as `google_place_id` (exempt from caching restrictions, reusable)
- `places.formattedAddress`: Full address for display and routing
- `places.location`: Lat/lng for distance calculations
- `places.displayName.text`: Official venue name (may differ from scraped name)

#### Find Place from Text Request (Legacy - Alternative)

```bash
curl "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?\
input=Great%20Park%20Ice%20Irvine%20CA&\
inputtype=textquery&\
fields=place_id,formatted_address,name,geometry&\
locationbias=circle:50000@33.6846,-117.8265&\
key=YOUR_API_KEY"
```

### 3. Confidence Scoring Strategy

**Important Finding**: Google Places API does NOT expose explicit "confidence scores" or "quality scores" in API responses.

**Instead, use these signals for confidence assessment:**

#### Primary Confidence Indicators

1. **Result Ranking (Position in Array)**
   - Results are sorted by **prominence** (Google's relevance algorithm)
   - First result is typically the best match
   - Prominence considers: Google's index ranking, global popularity, location bias
   - **Strategy**: Always prefer `places[0]` unless obvious mismatch

2. **Result Count**
   - Single result = High confidence
   - Multiple results = Requires disambiguation
   - Zero results = Venue name mismatch or location outside search radius

3. **Name Similarity Matching (Client-Side)**
   - Compare scraped name to `places[0].displayName.text`
   - Use fuzzy string matching (Levenshtein distance or similar)
   - Example: "Great Park Ice" vs "Great Park Ice & FivePoint Arena" = 80%+ match
   - **Threshold recommendation**: Accept if similarity >= 70%

4. **Location Bias Effectiveness**
   - Including `locationBias` dramatically improves result quality
   - For SCAHA venues, center bias on Orange County: `33.6846, -117.8265`
   - Use 50km radius to cover greater LA/OC area
   - Results outside bias area indicate potential mismatches

#### Confidence Scoring Implementation

```typescript
interface GeocodeConfidence {
  score: number; // 0-100
  reasoning: string;
  shouldAutoSave: boolean;
}

function assessConfidence(
  scrapedName: string,
  places: Place[],
  resultCount: number
): GeocodeConfidence {
  if (resultCount === 0) {
    return { score: 0, reasoning: "No results found", shouldAutoSave: false };
  }

  const topResult = places[0];
  const nameSimilarity = calculateSimilarity(scrapedName, topResult.displayName.text);

  if (resultCount === 1 && nameSimilarity >= 0.85) {
    return {
      score: 95,
      reasoning: "Single result with high name similarity",
      shouldAutoSave: true
    };
  }

  if (resultCount === 1 && nameSimilarity >= 0.70) {
    return {
      score: 80,
      reasoning: "Single result with moderate name similarity",
      shouldAutoSave: true
    };
  }

  if (resultCount > 1 && nameSimilarity >= 0.85) {
    return {
      score: 75,
      reasoning: "Multiple results but top result has high name similarity",
      shouldAutoSave: false // Require manual review
    };
  }

  return {
    score: 40,
    reasoning: "Low confidence - requires manual review",
    shouldAutoSave: false
  };
}
```

**Auto-Save Threshold**: >= 80% confidence score

### 4. Error Handling Approach

#### HTTP Status Codes

| Status Code | Meaning | Retry Strategy |
|-------------|---------|----------------|
| 200 | Success | N/A |
| 400 | Invalid request | Fix request, don't retry |
| 401 | Invalid API key | Fix credentials, don't retry |
| 403 | Forbidden (billing issue) | Check billing account |
| 429 | Rate limit exceeded | Exponential backoff + retry |
| 500 | Internal server error | Exponential backoff + retry |
| 503 | Service unavailable | Exponential backoff + retry |

#### Exponential Backoff Implementation

```typescript
async function geocodeWithRetry(
  venueName: string,
  maxRetries: number = 3
): Promise<Place[]> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
          },
          body: JSON.stringify({
            textQuery: `${venueName} ice rink Southern California`,
            includedType: 'gym',
            locationBias: {
              circle: {
                center: { latitude: 33.6846, longitude: -117.8265 },
                radius: 50000.0
              }
            }
          })
        }
      );

      if (response.ok) {
        return await response.json();
      }

      // Rate limit or transient error
      if ([429, 500, 503].includes(response.status)) {
        attempt++;
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Cap at 10s
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Non-retryable error
      throw new Error(`Places API error: ${response.status}`);

    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  throw new Error('Max retries exceeded');
}
```

#### Graceful Degradation

```typescript
async function getVenueAddress(venue: ScrapedVenue): Promise<Venue> {
  try {
    const places = await geocodeWithRetry(venue.name);

    if (places.length > 0) {
      const confidence = assessConfidence(venue.name, places, places.length);

      return {
        ...venue,
        google_place_id: places[0].id,
        full_address: places[0].formattedAddress,
        lat: places[0].location.latitude,
        lng: places[0].location.longitude,
        geocode_confidence: confidence.score,
        needs_manual_review: !confidence.shouldAutoSave
      };
    }
  } catch (error) {
    console.error(`Geocoding failed for ${venue.name}:`, error);
  }

  // Fallback: Store venue without geocoding
  return {
    ...venue,
    google_place_id: null,
    full_address: null,
    lat: null,
    lng: null,
    geocode_confidence: 0,
    needs_manual_review: true
  };
}
```

### 5. Rate Limit Mitigation

#### Quotas and Limits

**Default Limits (as of October 2025):**
- **Text Search (New)**: Separate per-method quota (typically 1000-10000 requests/minute)
- **Place Details (New)**: Separate per-method quota
- **Monthly Credit**: $200 (valid until February 28, 2025, subject to change)
- **Cost per Text Search**: Varies by SKU tier (see section 8)

**Important**: New Places API has per-method rate limits, so Text Search and Place Details don't share quota.

#### Rate Limiting Strategies

**1. Batch Processing with Delays**

```typescript
async function geocodeVenueBatch(venues: ScrapedVenue[]): Promise<Venue[]> {
  const results: Venue[] = [];
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES_MS = 2000; // 2 seconds

  for (let i = 0; i < venues.length; i += BATCH_SIZE) {
    const batch = venues.slice(i, i + BATCH_SIZE);

    // Process batch in parallel (respects rate limit per minute)
    const batchResults = await Promise.all(
      batch.map(venue => getVenueAddress(venue))
    );

    results.push(...batchResults);

    // Delay between batches to avoid bursts
    if (i + BATCH_SIZE < venues.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  return results;
}
```

**2. Queue-Based Processing**

For production systems, consider using a job queue (Bull, BullMQ) to:
- Distribute geocoding requests over time
- Avoid synchronized API calls at predictable times (start of hour/minute)
- Retry failed jobs automatically
- Monitor queue depth and processing rate

**3. Caching Strategy (Critical)**

```typescript
// Check cache before geocoding
async function getOrGeocodeVenue(venueName: string): Promise<Venue> {
  // 1. Check Supabase cache
  const cached = await supabase
    .from('venues')
    .select('*')
    .eq('name', venueName)
    .single();

  if (cached.data) {
    return cached.data;
  }

  // 2. Geocode and cache result
  const geocoded = await getVenueAddress({ name: venueName });

  await supabase
    .from('venues')
    .upsert({
      name: venueName,
      google_place_id: geocoded.google_place_id,
      full_address: geocoded.full_address,
      lat: geocoded.lat,
      lng: geocoded.lng,
      geocode_confidence: geocoded.geocode_confidence,
      needs_manual_review: geocoded.needs_manual_review,
      last_geocoded_at: new Date().toISOString()
    });

  return geocoded;
}
```

**4. Monitor Usage**

Use Google Cloud Console to:
- View real-time API usage (Google Maps Platform > Quotas)
- Set up quota alerts (notify at 80% usage)
- Adjust quota limits if needed (requires quota increase request)

### 6. Place ID Storage Best Practices

#### Why Store Place IDs

1. **Exempt from Caching Restrictions**: Unlike other Places API data, place_ids can be stored indefinitely
2. **Cost Savings**: Place Details by ID is cheaper than repeated Text Search calls
3. **Consistency**: Same place_id always refers to same physical location
4. **Future-Proof**: Can retrieve updated venue data (hours, ratings) without re-geocoding

#### Database Schema

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Scraped name (e.g., "Great Park Ice")
  google_place_id TEXT UNIQUE, -- Store once, reuse forever
  full_address TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  geocode_confidence INTEGER, -- 0-100
  needs_manual_review BOOLEAN DEFAULT false,
  last_geocoded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_name ON venues(name);
CREATE INDEX idx_venues_place_id ON venues(google_place_id);
CREATE INDEX idx_venues_needs_review ON venues(needs_manual_review) WHERE needs_manual_review = true;
```

#### Update Strategy

**Initial Geocoding**:
- Use Text Search to get place_id
- Store place_id, address, coordinates, confidence score

**Subsequent Updates** (optional, for fresh data):
- Use Place Details with stored place_id
- Update address/coordinates if changed (rare for ice rinks)
- Much cheaper than Text Search

```typescript
async function refreshVenueData(placeId: string): Promise<void> {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': 'formattedAddress,location,displayName'
      }
    }
  );

  const place = await response.json();

  await supabase
    .from('venues')
    .update({
      full_address: place.formattedAddress,
      lat: place.location.latitude,
      lng: place.location.longitude,
      updated_at: new Date().toISOString()
    })
    .eq('google_place_id', placeId);
}
```

**Refresh Cadence**: Quarterly or annually (venue addresses rarely change)

### 7. Handling Ambiguous Results (Multiple Matches)

#### Disambiguation Strategies

**1. Geographic Proximity** (Most Reliable)
- Use `locationBias` with SCAHA region center
- Results are auto-sorted by proximity + prominence
- Trust `places[0]` when location bias is specific

**2. Name Similarity Scoring**
```typescript
import { distance as levenshtein } from 'fastest-levenshtein';

function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  const dist = levenshtein(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (dist / maxLen);
}

// Example:
calculateSimilarity("Great Park Ice", "Great Park Ice & FivePoint Arena")
// Returns: 0.72 (72% similar)
```

**3. Additional Query Context**
Include city/state in `textQuery`:
```json
{
  "textQuery": "Great Park Ice Irvine CA" // Instead of just "Great Park Ice"
}
```

**4. Manual Review Queue**
For ambiguous cases (confidence < 80%), store in database with flag:
```typescript
{
  needs_manual_review: true,
  geocode_confidence: 65,
  geocode_candidates: [
    { place_id: "ChIJ...", name: "Great Park Ice", similarity: 0.72 },
    { place_id: "ChIK...", name: "Great Park Ice Rink", similarity: 0.68 }
  ]
}
```

**5. Admin Review Interface** (Future Enhancement)
Build UI for manual disambiguation:
- Show scraped venue name
- Display 3-5 candidate results with photos, addresses
- Allow admin to select correct match or mark as "no match"
- Selected place_id becomes permanent cache

#### Edge Cases

**Venue Name Variations:**
- "Jr Kings Ice" might be "Anaheim Ice" (home rink)
- SCAHA schedules sometimes use abbreviations
- Solution: Maintain venue name mapping table

```sql
CREATE TABLE venue_name_mappings (
  scraped_name TEXT PRIMARY KEY,
  canonical_venue_id UUID REFERENCES venues(id)
);

-- Example mappings:
INSERT INTO venue_name_mappings (scraped_name, canonical_venue_id) VALUES
  ('Jr Kings Ice', (SELECT id FROM venues WHERE name = 'Anaheim Ice')),
  ('GP Ice', (SELECT id FROM venues WHERE name = 'Great Park Ice'));
```

### 8. Cost Optimization with Field Masks

**Critical**: Field masking is the #1 cost control mechanism for Places API.

#### Pricing Tiers (SKUs)

| SKU Tier | Price per Request | Fields Included |
|----------|-------------------|-----------------|
| Essentials | $0.032 | id, displayName, formattedAddress, location |
| Pro | $0.037 | + hours, rating, reviews, photos |
| Enterprise | $0.045 | + atmosphere, contact info |

**Important**: You're billed at the **highest SKU tier** of any field requested.

#### Recommended Field Mask for Venue Geocoding

```typescript
// Only request what you need (Essentials tier = cheapest)
const FIELD_MASK = [
  'places.id',                    // Place ID (required for caching)
  'places.displayName',           // Venue name
  'places.formattedAddress',      // Full address
  'places.location'               // Lat/lng coordinates
].join(',');
```

#### Cost Calculation Example

**Scenario**: Geocode 100 new venues per season

- **Without field mask**: 100 requests × $0.045 (Enterprise tier) = $4.50
- **With field mask** (Essentials only): 100 requests × $0.032 = $3.20
- **Savings**: 28% cost reduction

**With caching**: Subsequent season uses Place Details (ID-only) at $0.017/request
- 100 requests × $0.017 = $1.70
- **Total savings**: 62% vs. repeated Text Search without caching

#### Annual Cost Projection

Assumptions:
- 50 unique SCAHA venues
- 2 seasons per year
- 10% new venues per season (5 venues)

Year 1:
- Initial geocoding: 50 venues × $0.032 = $1.60
- Quarterly updates: 50 venues × 4 quarters × $0.017 = $3.40
- **Total**: $5.00/year

Year 2+:
- New venues: 5 × $0.032 = $0.16
- Updates: 55 × 4 × $0.017 = $3.74
- **Total**: $3.90/year

**Conclusion**: With proper caching and field masking, venue geocoding costs are negligible (~$5/year).

### 9. Implementation Checklist

- [ ] Set up Google Cloud project and enable Places API (New)
- [ ] Generate API key with Places API restrictions
- [ ] Create `venues` table in Supabase with place_id storage
- [ ] Implement Text Search client with field masking
- [ ] Build confidence scoring logic (name similarity + result count)
- [ ] Add exponential backoff retry logic
- [ ] Implement batch processing with rate limit delays
- [ ] Create manual review queue for low-confidence results
- [ ] Set up Google Cloud Console quota alerts
- [ ] Build admin UI for venue disambiguation (optional, post-MVP)
- [ ] Test with sample SCAHA venue names

### 10. References

- [Places API (New) Overview](https://developers.google.com/maps/documentation/places/web-service/op-overview)
- [Text Search (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Place Details (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Places API Usage and Billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Place Data Fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [Best Practices for Places API Web Services](https://developers.google.com/maps/documentation/places/web-service/web-services-best-practices)

---

**Last Updated**: October 13, 2025

---

## Admin UI Patterns

**Research Date**: 2025-10-13
**Context**: Building admin review UI for unresolved venue matches with one-click actions, map previews, and queue management using Next.js 15 with shadcn/ui components.

### Authentication: Simple Password (Cookie-Based Session)

**Recommendation**: Use environment variable-based password with HTTP-only cookies over Supabase Auth.

**Rationale:**
- 2-3 admin users = shared password acceptable
- Implementation: 30 minutes vs 2-3 hours
- Cookie-based session provides better UX than HTTP Basic Auth
- Can migrate to Supabase Auth post-MVP if team grows

**Environment Variables:**
```bash
ADMIN_PASSWORD=secure_random_string_here
```

### Map Integration: Google Maps Static API

**Recommendation**: Use Static Maps API over Embed API for candidate previews.

**Rationale:**
- Lightweight (~50KB vs ~500KB for iframe)
- Display 3 color-coded pins on single map
- Free tier: 28,500 requests/month (expected usage: 600-3,000/month)
- Cacheable by browser
- Cost: $0.00 for venue review use case

**Implementation:**
```typescript
const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=11&size=600x300&markers=color:red%7Clabel:1%7C${lat1},${lng1}&markers=color:blue%7Clabel:2%7C${lat2},${lng2}&key=${API_KEY}`
```

### One-Click Actions: Hybrid Approach

**Recommendation**: Use optimistic updates for Approve, confirmation dialogs for Reject/Create.

| Action | Pattern | Rationale |
|--------|---------|-----------|
| **Approve Match** | Optimistic Update + Toast | High frequency, high confidence, reversible |
| **Skip/Next** | Instant (no confirmation) | Non-destructive navigation |
| **Reject Match** | AlertDialog Confirmation | Prevents false candidate from reappearing |
| **Create New Venue** | Dialog Form + Validation | Creates permanent data |

**Toast Notifications** (using Sonner):
```typescript
import { toast } from 'sonner'
toast.success('Venue match approved')
toast.error('Failed to approve match')
toast.promise(createNewVenue(...), { loading: 'Creating...', success: 'Created!', error: 'Failed' })
```

### Queue Management: "Next Item" Pattern

**Recommendation**: Single-item focus with filters + auto-approve high-confidence matches (>0.9).

**Benefits:**
- Focused attention on one item at a time
- Keyboard shortcuts (a=approve, r=reject, n=next, s=skip)
- Progress indicator: "12 of 47 remaining"
- Reduces admin workload by 70-80% through auto-approval

**Essential Filters:**
- **Confidence Score**: High (>0.7), Low (<0.7), All
- **Source**: SCAHA, PGHL, All
- **Date Added**: Last 7 days, Last 30 days, All time

### shadcn/ui Component Structure

**Available Components** (already in v0_UI/):
- ✅ Card, Button, Dialog, AlertDialog
- ✅ Badge, Alert, Progress, Skeleton
- ✅ Form, Input, Select, Sonner
- ✅ Table, ScrollArea, Separator

**Recommended Layout:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>{aliasName}</CardTitle>
    <Badge>Confidence: {score}</Badge>
  </CardHeader>
  <CardContent>
    <VenueCandidateMap candidates={top3} />
    {candidates.map(c => <CandidateCard {...c} />)}
  </CardContent>
  <CardFooter>
    <Button variant="outline" onClick={skip}>Skip</Button>
    <RejectButton /> {/* AlertDialog */}
    <CreateVenueDialog /> {/* Dialog with Form */}
    <ApproveButton /> {/* Optimistic update */}
  </CardFooter>
</Card>
```

### State Management: TanStack Query + useState

**Recommendation**: TanStack Query for server state, useState for local UI state.

**TanStack Query** (server state):
- Fetch review queue from `/api/venue/admin/queue`
- Automatic caching, refetching on window focus
- `useMutation` for approve/reject/create actions

**useState** (local UI state):
- Filter selections
- Dialog open/closed states
- Form inputs

**useOptimistic** (React 19):
- Instant UI updates for approve/skip actions
- Automatic rollback on error

### File Organization

```
app/admin/
├── layout.tsx                    # Auth check via middleware
├── venues/review/
│   ├── page.tsx                  # Main review queue
│   ├── actions.ts                # Server Actions
│   └── components/
│       ├── candidate-map.tsx     # Static map with 3 pins
│       ├── candidate-card.tsx    # Venue candidate display
│       ├── create-venue-dialog.tsx
│       └── filters.tsx

middleware.ts                     # Cookie-based auth check
```

### Environment Variables

```bash
# Admin Authentication
ADMIN_PASSWORD=secure_random_string_change_this

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Supabase (already required for venue database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Summary

| Decision Area | Recommendation | Key Rationale |
|---------------|----------------|---------------|
| **Authentication** | Simple password (cookie) | MVP-focused, 2-3 users, 30min setup |
| **Map Integration** | Static Maps API | Free tier sufficient, shows all candidates |
| **One-Click Actions** | Hybrid (optimistic/confirmation) | Balance speed and safety |
| **Queue Management** | "Next Item" + auto-approve >0.9 | Focused workflow, 70-80% workload reduction |
| **Components** | shadcn/ui (Card, Dialog, Badge) | Already available, consistent design |
| **State Management** | TanStack Query + useState | Server/client state separation |

**Status**: ✅ Complete | **Next Phase**: Design & Contracts (Phase 1)

---

## Trigram Similarity Threshold Tuning

### Executive Summary

The 0.7 similarity threshold chosen for venue disambiguation is **above optimal** for most fuzzy matching scenarios. Research indicates that 0.7 represents a very strict matching criterion that may miss valid variations while reducing ambiguity. A threshold in the 0.4-0.6 range would be more appropriate for venue name matching, with **0.5 recommended as the starting point**.

### Typical pg_trgm Similarity Score Ranges

#### Function Return Values
All pg_trgm similarity functions return values between 0 and 1:
- **0.0** = Completely dissimilar (no shared trigrams)
- **1.0** = Identical strings (exact same trigram set)
- **0.05-0.15** = Very dissimilar strings (even if phonetically similar)
- **0.3-0.4** = Noticeable similarity, common misspellings
- **0.5-0.7** = Strong similarity, likely same entity with variations
- **0.7-0.9** = Very strong similarity, minor differences only
- **0.9-1.0** = Nearly identical, trivial differences

#### PostgreSQL Default Thresholds
PostgreSQL's built-in defaults provide guidance on expected values:
- `pg_trgm.similarity_threshold`: **0.3** (standard similarity operator `%`)
- `pg_trgm.word_similarity_threshold`: **0.6** (word boundary operators `<%`, `%>`)
- `pg_trgm.strict_word_similarity_threshold`: **0.5** (strict word operators `<<%`, `%>>`)

The default of 0.3 is intentionally permissive to cast a wide net. The word similarity threshold of 0.6 is more restrictive and designed for matching within longer texts.

### Venue Name Matching Context

#### Real-World Business Name Examples
Research on business name matching (analogous to venue matching) shows:
- At **0.95 threshold**: "3 Day Blinds" matches "3 Day Blinds 4" and "3 Day Blinds 216" (very safe)
- At **0.89 threshold**: "4 Season Nails" matches "4 Seasons Salon & Day Spa" (borderline)
- At **0.85 threshold**: "1st & Foremost Inc" matches "1st UNI Meth Scout" (false positive risk)

#### Venue-Specific Considerations
Hockey venue names typically include:
- **Rink name**: "Anaheim ICE", "Pickwick Ice Center"
- **Location markers**: "East", "West", "Downtown"
- **Facility type**: "Ice Arena", "Center", "Rink"
- **Abbreviations**: "ICE" vs "Ice", "Ctr" vs "Center"

Common variations that should match:
- "Pickwick Ice Center" vs "Pickwick Ice"
- "Anaheim ICE" vs "Anaheim Ice Center"
- "RINK" vs "Rink" (case variations)

Variations that should NOT match:
- "Great Park Ice" vs "Simi Valley ICE" (different venues)
- "Glacial Gardens East" vs "Glacial Gardens West" (different rinks at same facility)

### Threshold Recommendation Validation

#### Current Threshold: 0.7
**Strengths:**
- High precision: Matches are very likely correct
- Minimal false positives
- Good for safety-critical applications

**Weaknesses:**
- Low recall: May miss valid variations
- Too strict for abbreviation matching ("Center" vs "Ctr" may not reach 0.7)
- Overkill for disambiguation (returns top 3 when <0.7)
- Doesn't align with PostgreSQL community norms (almost 3x stricter than default)

#### Recommended Threshold: 0.5
**Rationale:**
- Aligns with PostgreSQL's strict_word_similarity_threshold default
- Balances precision and recall for entity name matching
- Handles abbreviations and minor variations well
- Reduces unnecessary disambiguation requests

**Expected Behavior:**
- **>= 0.7**: Return single match (very high confidence)
- **0.5-0.69**: Return single match (high confidence)
- **0.3-0.49**: Return top 3 matches (moderate confidence, needs disambiguation)
- **< 0.3**: Return top 3 matches or indicate poor match quality

### Summary: Key Takeaways

1. **0.7 is too strict** for general venue matching; 0.5 is recommended starting point
2. **Empirical testing** with real venue data is essential for tuning
3. **Ties are common** and require explicit handling strategy (return all or use context)
4. **GIN indexes are efficient** across wide threshold range (0.3-0.7)
5. **Monitor in production** with metrics on precision, recall, and disambiguation rate
6. **Alternatives exist** if trigram similarity alone proves insufficient (hybrid scoring, ML, phonetic matching)

The goal is to **minimize disambiguation requests while maintaining high match accuracy**. A threshold of 0.5-0.6 likely achieves this balance better than 0.7.

---

**Threshold Tuning Research Complete** | October 13, 2025
