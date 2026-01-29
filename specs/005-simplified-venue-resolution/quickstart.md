# Quickstart: Simplified Venue Resolution System

**Feature**: 005-simplified-venue-resolution
**Date**: 2025-10-13
**Estimated Setup Time**: 15 minutes

## Prerequisites

- [ ] Supabase account (free tier)
- [ ] Node.js 20+ installed
- [ ] pnpm installed
- [ ] Hand-curated SCAHA venue data (CSV format)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `hockeygotime-venues` (or your preference)
   - **Database Password**: Generate strong password and save it
   - **Region**: Choose closest to your users (e.g., `us-west-1`)
4. Click "Create new project" and wait 2-3 minutes for provisioning

---

## Step 2: Run Database Migration

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the following SQL:

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
```

4. Click "Run" (or press `Cmd/Ctrl + Enter`)
5. Verify success: "Success. No rows returned"

---

## Step 3: Get Supabase Credentials

1. In Supabase dashboard, click **Project Settings** (gear icon, left sidebar)
2. Click **API** (left sidebar under Project Settings)
3. Copy these values:

```bash
# Project URL
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Configure Environment Variables

1. In your HockeyGoTime project root, open `.env.local` (create if missing)
2. Add Supabase credentials:

```bash
# .env.local
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Also update `.env.local.template` for documentation:

```bash
# .env.local.template
OPENAI_API_KEY=sk-...your-key-here...
SCAHA_MCP_URL=https://scaha-mcp.vercel.app/api/mcp
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 5: Install Dependencies

```bash
cd HockeyGoTime
pnpm add @supabase/supabase-js
pnpm add -D tsx csv-parse
```

---

## Step 6: Prepare Venue Data (CSV)

Create `data/scaha-venues.csv` with this format:

```csv
canonical_name,address,place_id,league,aliases
Toyota Sports Performance Center,"555 N. Monterey Pass Rd, Monterey Park, CA 91755",ChIJ...,SCAHA,TSPC|Toyota Sports Center
Yorba Linda Ice,"22223 Yorba Linda Blvd, Yorba Linda, CA 92887",ChIJ...,SCAHA,Yorba Linda|YL Ice
The Rinks - Anaheim ICE,"300 W. Lincoln Ave, Anaheim, CA 92805",ChIJ...,SCAHA,Anaheim ICE|The Rinks Anaheim
```

**CSV Format Notes**:
- **canonical_name**: Official venue name (unique)
- **address**: Full street address with city, state, zip
- **place_id**: Google Place ID (get from [Google Place Finder](https://developers.google.com/maps/documentation/places/web-service/place-id))
- **league**: Either `SCAHA` or `PGHL`
- **aliases**: Pipe-separated list of alternative names (optional)

---

## Step 7: Run Import Script

```bash
# From HockeyGoTime project root
pnpm tsx scripts/import-venues.ts data/scaha-venues.csv
```

**Expected Output**:

```
✅ Imported Toyota Sports Performance Center (2 aliases)
✅ Imported Yorba Linda Ice (2 aliases)
✅ Imported The Rinks - Anaheim ICE (2 aliases)

Summary: 3 venues, 6 aliases imported
```

**Troubleshooting**:
- **Missing env vars**: Check `.env.local` has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **Duplicate canonical_name**: Remove duplicate from CSV
- **Invalid place_id**: Verify Place ID is correct (test in [Google Place Finder](https://developers.google.com/maps/documentation/places/web-service/place-id))

---

## Step 8: Verify Data in Supabase

1. In Supabase dashboard, click **Table Editor** (left sidebar)
2. Click **venues** table
3. Verify all venues are listed
4. Click **venue_aliases** table
5. Verify all aliases are listed with correct `venue_id`

---

## Step 9: Test Resolution API

### Start Dev Server

```bash
cd HockeyGoTime
pnpm dev
```

### Test Exact Match

```bash
curl -X POST http://localhost:3000/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "Toyota Sports Performance Center",
    "league": "SCAHA"
  }'
```

**Expected Response**:

```json
{
  "venue": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "canonical_name": "Toyota Sports Performance Center",
    "address": "555 N. Monterey Pass Rd, Monterey Park, CA 91755",
    "place_id": "ChIJ...",
    "league": "SCAHA"
  }
}
```

### Test Alias Match

```bash
curl -X POST http://localhost:3000/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "TSPC",
    "league": "SCAHA"
  }'
```

**Expected Response**: Same venue as above

### Test Substring Match

```bash
curl -X POST http://localhost:3000/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "Toyota",
    "league": "SCAHA"
  }'
```

**Expected Response**: Same venue as above

### Test Not Found

```bash
curl -X POST http://localhost:3000/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "Nonexistent Venue",
    "league": "SCAHA"
  }'
```

**Expected Response**:

```json
{
  "venue": null
}
```

---

## Step 10: Test Cache Refresh

### Manually Refresh Cache

```bash
curl -X POST http://localhost:3000/api/venue/refresh-cache
```

**Expected Response**:

```json
{
  "success": true,
  "venue_count": 3,
  "alias_count": 6,
  "refreshed_at": "2025-10-13T12:34:56.789Z"
}
```

---

## Step 11: Add New Venue via Supabase Dashboard

1. In Supabase dashboard, click **Table Editor** → **venues**
2. Click "Insert" → "Insert row"
3. Fill in fields:
   - **canonical_name**: `"Ice Palace"`
   - **address**: `"123 Example St, Los Angeles, CA 90001"`
   - **place_id**: `"ChIJ..."`
   - **league**: `"SCAHA"`
4. Click "Save"

5. Click **Table Editor** → **venue_aliases**
6. Click "Insert" → "Insert row"
7. Fill in fields:
   - **venue_id**: (select the Ice Palace venue from dropdown)
   - **alias_text**: `"Ice Palace LA"`
8. Click "Save"

9. **Refresh cache** to make it immediately available:

```bash
curl -X POST http://localhost:3000/api/venue/refresh-cache
```

10. **Test new venue**:

```bash
curl -X POST http://localhost:3000/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "Ice Palace",
    "league": "SCAHA"
  }'
```

---

## Step 12: Deploy to Vercel

1. Push changes to GitHub
2. In Vercel dashboard, add environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
3. Deploy automatically triggers
4. Test production endpoint:

```bash
curl -X POST https://hockeygotime.vercel.app/api/venue/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "venue_name": "TSPC",
    "league": "SCAHA"
  }'
```

---

## Maintenance

### Adding New Venues

**Option 1: Via Supabase Dashboard** (Recommended)
1. Insert venue via Table Editor
2. Insert aliases via Table Editor
3. Call `/api/venue/refresh-cache` endpoint

**Option 2: Via CSV Import**
1. Add venue to CSV file
2. Run `pnpm tsx scripts/import-venues.ts data/scaha-venues.csv`
3. Cache refreshes automatically on next request (or call refresh endpoint)

### Updating Addresses

1. Update venue in Supabase Table Editor
2. Call `/api/venue/refresh-cache` endpoint
3. Verify with resolution API test

### Cache Behavior

- **Automatic refresh**: Every 24 hours on next request
- **Manual refresh**: Call `/api/venue/refresh-cache` anytime
- **Performance**: <1ms after first request (cache hit)

---

## Troubleshooting

### "Missing SUPABASE_URL environment variable"

- Check `.env.local` has correct credentials
- Restart dev server after adding env vars

### "Failed to load venues from database"

- Verify Supabase project is running
- Check database tables exist (run migration again if needed)
- Verify anon key has read access to tables

### Cache not refreshing

- Check browser/API client isn't caching responses
- Force refresh with `curl -X POST /api/venue/refresh-cache`
- Restart dev server to clear in-memory cache

### Duplicate venue error

- Check CSV for duplicate canonical names
- Use Supabase Table Editor to find and remove duplicates

---

## Next Steps

- [ ] Import all 30+ SCAHA venues
- [ ] Add PGHL venues when ready
- [ ] Integrate with chat agent (add venue resolution before travel time calculations)
- [ ] Monitor cache performance in production

---

## Reference

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/resolve-venue.openapi.yml](./contracts/resolve-venue.openapi.yml)
- **Supabase Docs**: https://supabase.com/docs
