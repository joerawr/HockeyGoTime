# Phase 0: Technical Research - Hockey Go Time

**Feature**: 001-hockey-go-time | **Date**: 2025-10-07 | **Plan**: [plan.md](./plan.md)

## Research Scope

This document captures technical research for implementing the Hockey Go Time travel planning and stats enhancement features. Given the tight Capstone timeline (2.5 weeks) and existing working foundation, research focuses on delta features: user preferences storage, Google Routes API integration, caching architecture, and stats MCP tools.

## 1. User Preferences - localStorage Architecture

### Research Question
How should user preferences (team, home address, prep time, arrival buffer, min wake-up time) be stored and accessed in Next.js 15 with Server Components?

### Findings

**Client-Side Storage Pattern**:
- localStorage is browser API (client-side only)
- Next.js Server Components cannot directly access localStorage
- Solution: Client Component wrapper with React Context or state management

**Recommended Architecture**:
```typescript
// lib/storage/preferences.ts (client-only utility)
export interface UserPreferences {
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"
  homeAddress: string;       // Full address for geocoding
  prepTimeMinutes: number;   // Default: 30
  arrivalBufferMinutes: number; // Default: 60. Coach requires minimum 1 hr before game time.
  minWakeUpTime?: string;    // e.g., "06:00" (optional, for hotel feature)
}

export const PreferencesStore = {
  get(): UserPreferences | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('hgt-preferences');
    return data ? JSON.parse(data) : null;
  },

  set(prefs: UserPreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hgt-preferences', JSON.stringify(prefs));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('hgt-preferences');
  }
};
```

**UI Integration Pattern**:
- Create `components/ui/preferences/PreferencePanel.tsx` (Client Component)
- Use React state synced with localStorage
- Display in sidebar or collapsible panel
- Auto-load on mount, auto-save on change

**No Research Blockers**: Standard Next.js pattern, well-documented.

---

## 2. Google Maps Routes API v2 Integration

### Research Question
How to integrate Google Routes API v2 with `arrivalTime` parameter for traffic-aware routing in Next.js server-side route handlers?

### Findings

**API Endpoint**: `https://routes.googleapis.com/directions/v2:computeRoutes`

**Request Pattern** (from user-provided Python code):
```typescript
// lib/travel/google-routes.ts
import type { RouteResponse, ComputeRoutesRequest } from '@/types/travel';

export async function computeRoute(params: {
  originAddress: string;
  destinationAddress: string;
  arrivalTime: string; // ISO 8601, e.g., "2025-10-05T07:00:00-07:00"
}): Promise<RouteResponse> {
  const request: ComputeRoutesRequest = {
    origin: { address: params.originAddress },
    destination: { address: params.destinationAddress },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    arrivalTime: params.arrivalTime, // Key parameter for traffic prediction
    computeAlternativeRoutes: false,
    languageCode: 'en-US',
    units: 'IMPERIAL'
  };

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Google Routes API error: ${response.statusText}`);
  }

  return response.json();
}
```

**Response Structure**:
```typescript
interface RouteResponse {
  routes: Array<{
    duration: string;        // e.g., "3600s" (seconds with 's' suffix)
    distanceMeters: number;  // e.g., 45000
    polyline?: {
      encodedPolyline: string; // For map rendering (optional)
    };
  }>;
}
```

**Key Implementation Details**:
1. **arrivalTime**: ISO 8601 format with timezone (e.g., `2025-10-05T07:00:00-07:00`)
2. **TRAFFIC_AWARE_OPTIMAL**: Uses historical and real-time traffic data
3. **Field Mask**: Request only needed fields to minimize response size
4. **API Key**: Environment variable `GOOGLE_MAPS_API_KEY` (already available per user)

**Integration with MCP Tool**:
- AI queries "when do I need to leave for Sunday's game?"
- System calls SCAHA MCP `get_schedule` to find game (time, venue)
- System extracts venue address (hardcoded mapping in system prompt for Capstone)
- System calls `computeRoute(homeAddress, venueAddress, gameTime)`
- System calculates: `departureTime = gameTime - arrivalBuffer - travelDuration - prepTime`
- AI formats response: "You need to leave at 5:30 AM to arrive by 7:00 AM"

**No Research Blockers**: API tested and working (user confirmed). Standard fetch pattern.

---

## 3. Caching Architecture - Two-Phase Strategy

### Research Question
How to implement in-memory cache (P1) with seamless migration path to Supabase (P2)?

### Findings

**Phase 1: In-Memory Cache (Map-based)**

```typescript
// lib/cache/memory-cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instances
export const scheduleCache = new MemoryCache<ScheduleData>();
export const statsCache = new MemoryCache<StatsData>();
```

**Cache Key Pattern**:
- Schedule: `schedule:${season}:${division}:${team}` (e.g., `schedule:2025/2026:14U-B:jr-kings-1`)
- Stats: `stats:${season}:${division}:${team}` or `stats:${season}:${player}`

**Limitations**:
- Vercel serverless functions are stateless (cache resets on cold start)
- Suitable for development and initial testing only
- Provides immediate UX improvement despite cold start resets

**Phase 2: Supabase Server-Side Cache**

```typescript
// lib/cache/supabase-cache.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getCachedSchedule(key: string): Promise<ScheduleData | null> {
  const { data, error } = await supabase
    .from('cache_schedule')
    .select('data, updated_at')
    .eq('key', key)
    .single();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.updated_at).getTime();
  const TTL = 24 * 60 * 60 * 1000; // 24 hours

  if (age > TTL) {
    await supabase.from('cache_schedule').delete().eq('key', key);
    return null;
  }

  return data.data as ScheduleData;
}

export async function setCachedSchedule(key: string, data: ScheduleData): Promise<void> {
  await supabase
    .from('cache_schedule')
    .upsert({ key, data, updated_at: new Date().toISOString() });
}
```

**Migration Path**:
1. Create abstraction interface (`CacheProvider`)
2. Implement both `MemoryCacheProvider` and `SupabaseCacheProvider`
3. Use environment variable to switch: `CACHE_PROVIDER=memory|supabase`
4. No code changes in calling sites

**Supabase Schema** (for reference):
```sql
CREATE TABLE cache_schedule (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cache_schedule_updated_at ON cache_schedule(updated_at);

-- Same pattern for cache_stats
```

**No Research Blockers**: Standard patterns. In-memory cache for P1, Supabase integration for P2.

---

## 4. SCAHA MCP Stats Tools

### Research Question
Are `get_team_stats` and `get_player_stats` tools already implemented in SCAHA MCP server?

### Findings

**Current SCAHA MCP Tools** (from existing integration):
- ✅ `get_schedule`: Implemented and working
- ❓ `get_team_stats`: Not yet verified (requires MCP server inspection)
- ❓ `get_player_stats`: Not yet verified (requires MCP server inspection)

**Assumption** (per user clarification):
- User stated: "This will be easy to implement as it will be similar to the existing MCP tool"
- Implies: If not implemented, the pattern follows `get_schedule` (Puppeteer scraping of scaha.net)

**Implementation Pattern** (if needed):
```typescript
// In SCAHA MCP Server (external project)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'get_team_stats':
      const { season, division, team } = request.params.arguments;
      const statsPage = await page.goto(`https://www.scaha.net/stats/team/${season}/${division}/${team}`);
      // Scrape table data...
      return { content: [{ type: 'text', text: JSON.stringify(stats) }] };

    case 'get_player_stats':
      // Similar pattern for player stats
  }
});
```

**Integration in HockeyGoTime**:
```typescript
// app/api/hockey-chat/route.ts
const schahaClient = await getScahaClient();
const tools = await schahaClient.tools(); // Auto-discovers all MCP tools

const result = streamText({
  model: openai('gpt-5-mini'),
  messages,
  tools, // Includes get_schedule, get_team_stats, get_player_stats
  // ...
});
```

**Action Required**:
- Verify SCAHA MCP server has stats tools (check scaha-mcp repository or documentation)
- If missing: coordinate with SCAHA MCP maintainer (user) to add tools
- If present: test tool response format and update types

**Research Status**: NEEDS VERIFICATION - Check SCAHA MCP server capabilities before implementing stats features.

---

## 5. Venue Address Hardcoding Strategy (Capstone)

### Research Question
How to hardcode venue name → address mappings in system prompt for Capstone demo?

### Findings

**Approach**: Extend `components/agent/hockey-prompt.ts` with venue mapping context

**Example Implementation**:
```typescript
export const HOCKEY_SYSTEM_PROMPT = `
You are HockeyGoTime, an AI assistant for SCAHA youth hockey schedules...

## Venue Address Mappings (Capstone Demo)

When a game is scheduled at one of these venues, use the mapped address for travel calculations:

- "Anaheim Ice" → "300 W Lincoln Ave, Anaheim, CA 92805"
- "Great Park Ice" → "888 Ridge Valley, Irvine, CA 92618"
- "Ice Town Riverside" → "6729 Indiana Ave, Riverside, CA 92506"
- "Iceoplex Simi Valley" → "2450 Sycamore Dr, Simi Valley, CA 93065"
- "KHS Ice Arena" → "3033 Kelton Ave, Los Angeles, CA 90034"
- "Lakewood Ice" → "5700 E Carson St, Lakewood, CA 90713"
- "Ontario Reign" → "4000 Ontario Center Pkwy, Ontario, CA 91764"
- "Pasadena Ice Skating Center" → "300 E Green St, Pasadena, CA 91101"
- "Pickwick Ice" → "1001 Riverside Dr, Burbank, CA 91506"
- "Skate San Diego" → "10380 Scripps Trail, San Diego, CA 92131"
- "The Rinks - Anaheim" → "300 W Lincoln Ave, Anaheim, CA 92805"
- "Toyota Sports Complex" → "555 N Nash St, El Segundo, CA 90245"
- "Vacaville Ice Sports" → "601 Orange Dr, Vacaville, CA 95687"

If a venue is not listed above, inform the user that venue address is not yet mapped and travel calculations cannot be provided.

...
`;
```

**Data Source**:
- User will provide list of venues from demo schedules (14U B Jr. Kings (1) games)
- Manual one-time mapping exercise
- Covers ~10-15 venues for Capstone demo

**Post-Capstone Migration Path**:
1. Scrape all SCAHA venue names across divisions
2. LLM deduplication ("Anaheim Ice" vs "The Rinks - Anaheim" → same venue?)
3. LLM address search with confidence scoring
4. Human verification for low-confidence matches
5. Store in database/file for agentic RAG retrieval
6. Remove hardcoded mappings from prompt

**No Research Blockers**: Simple string mapping. User will provide venue list.

---

## Research Summary

### Ready to Implement (No Blockers)
1. ✅ localStorage preferences architecture (standard Next.js pattern)
2. ✅ Google Routes API v2 integration (tested, API key available)
3. ✅ In-memory caching (Phase 1 - Map-based)
4. ✅ Venue hardcoding in system prompt (user to provide list)

### Needs Verification Before Implementation
1. ❓ SCAHA MCP stats tools (`get_team_stats`, `get_player_stats`) - check MCP server capabilities

### Deferred to Phase 2
1. ⏸️ Supabase caching implementation (P2 after in-memory cache working)
2. ⏸️ Hotel recommendations (deferred post-Capstone)

### External Dependencies
1. **SCAHA MCP Server**: Must provide stats tools or accept contribution
2. **Environment Variables**: `GOOGLE_MAPS_API_KEY` (already available), `SCAHA_MCP_URL` (already configured)

---

## Next Steps

1. **Verify SCAHA MCP Stats Tools**: Check scaha-mcp repository for tool implementations
2. **Obtain Venue List**: User to provide 14U B Jr. Kings (1) venue names for hardcoding
3. **Proceed to Phase 1**: Generate data model and API contracts based on research findings
