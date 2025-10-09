# API Contract: Cache Provider Interface

**Purpose**: Abstract cache storage layer to enable seamless migration from in-memory (P1) to Supabase (P2)

**Implementation**: Two-phase strategy with shared interface

---

## Interface Definition

### CacheProvider Interface

```typescript
interface CacheProvider<T> {
  /**
   * Retrieve cached data by key
   * @param key Cache key (e.g., "schedule:2025/2026:14U-B:jr-kings-1")
   * @returns Cached data or null if not found or expired
   */
  get(key: string): Promise<T | null>;

  /**
   * Store data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds (default: 24 hours)
   */
  set(key: string, data: T, ttl?: number): Promise<void>;

  /**
   * Remove specific cache entry
   * @param key Cache key to remove
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Check if key exists and is not expired
   * @param key Cache key
   * @returns true if key exists and valid
   */
  has(key: string): Promise<boolean>;
}
```

---

## Phase 1: In-Memory Implementation

**File**: `lib/cache/memory-cache.ts`

**Purpose**: Fast development, immediate UX improvement, no external dependencies

### Implementation

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCacheProvider<T> implements CacheProvider<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}
```

### Singleton Instances

```typescript
// lib/cache/index.ts
import type { ScheduleData, TeamStats, PlayerStats } from '@/types';
import { MemoryCacheProvider } from './memory-cache';

export const scheduleCache = new MemoryCacheProvider<ScheduleData>();
export const teamStatsCache = new MemoryCacheProvider<TeamStats>();
export const playerStatsCache = new MemoryCacheProvider<PlayerStats>();
```

### Limitations

- **Stateless Serverless**: Vercel serverless functions reset cache on cold start
- **No Persistence**: Cache is lost when function instance terminates
- **Single Instance**: No sharing across multiple serverless instances
- **No Distributed Locking**: Potential cache stampede on cache miss

**Mitigation**: Acceptable for P1—provides immediate performance boost despite cold start resets. Users will experience fast responses when cache is warm.

---

## Phase 2: Supabase Implementation

**File**: `lib/cache/supabase-cache.ts`

**Purpose**: Persistent, distributed cache with multi-instance support

### Database Schema

```sql
-- Schedule cache table
CREATE TABLE cache_schedule (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ttl_seconds INTEGER DEFAULT 86400 -- 24 hours
);

CREATE INDEX idx_cache_schedule_updated_at ON cache_schedule(updated_at);

-- Team stats cache table
CREATE TABLE cache_team_stats (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ttl_seconds INTEGER DEFAULT 86400
);

CREATE INDEX idx_cache_team_stats_updated_at ON cache_team_stats(updated_at);

-- Player stats cache table
CREATE TABLE cache_player_stats (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ttl_seconds INTEGER DEFAULT 86400
);

CREATE INDEX idx_cache_player_stats_updated_at ON cache_player_stats(updated_at);
```

### Implementation

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CacheProvider } from './types';

export class SupabaseCacheProvider<T> implements CacheProvider<T> {
  private supabase: SupabaseClient;
  private tableName: string;
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(tableName: string) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.tableName = tableName;
  }

  async get(key: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('data, updated_at, ttl_seconds')
      .eq('key', key)
      .single();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.updated_at).getTime();
    const ttl = data.ttl_seconds * 1000;

    if (age > ttl) {
      // Expired, delete and return null
      await this.delete(key);
      return null;
    }

    return data.data as T;
  }

  async set(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    const ttlSeconds = Math.floor(ttl / 1000);

    await this.supabase
      .from(this.tableName)
      .upsert({
        key,
        data,
        updated_at: new Date().toISOString(),
        ttl_seconds: ttlSeconds,
      });
  }

  async delete(key: string): Promise<void> {
    await this.supabase
      .from(this.tableName)
      .delete()
      .eq('key', key);
  }

  async clear(): Promise<void> {
    await this.supabase
      .from(this.tableName)
      .delete()
      .neq('key', ''); // Delete all rows
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}
```

### Singleton Instances

```typescript
// lib/cache/index.ts
import { SupabaseCacheProvider } from './supabase-cache';

export const scheduleCache = new SupabaseCacheProvider<ScheduleData>('cache_schedule');
export const teamStatsCache = new SupabaseCacheProvider<TeamStats>('cache_team_stats');
export const playerStatsCache = new SupabaseCacheProvider<PlayerStats>('cache_player_stats');
```

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Provider Factory (Migration Pattern)

**File**: `lib/cache/factory.ts`

**Purpose**: Switch cache provider via environment variable without code changes

```typescript
import { MemoryCacheProvider } from './memory-cache';
import { SupabaseCacheProvider } from './supabase-cache';
import type { CacheProvider } from './types';

type CacheType = 'schedule' | 'team-stats' | 'player-stats';

const TABLE_NAMES: Record<CacheType, string> = {
  'schedule': 'cache_schedule',
  'team-stats': 'cache_team_stats',
  'player-stats': 'cache_player_stats',
};

export function createCacheProvider<T>(type: CacheType): CacheProvider<T> {
  const provider = process.env.CACHE_PROVIDER || 'memory';

  if (provider === 'supabase') {
    return new SupabaseCacheProvider<T>(TABLE_NAMES[type]);
  }

  return new MemoryCacheProvider<T>();
}

// Export singleton instances
export const scheduleCache = createCacheProvider<ScheduleData>('schedule');
export const teamStatsCache = createCacheProvider<TeamStats>('team-stats');
export const playerStatsCache = createCacheProvider<PlayerStats>('player-stats');
```

### Usage in Code

```typescript
// app/api/hockey-chat/route.ts
import { scheduleCache } from '@/lib/cache';

// Works with both memory and Supabase providers—no code changes needed
const cachedSchedule = await scheduleCache.get(cacheKey);
if (!cachedSchedule) {
  const freshSchedule = await getScheduleFromMCP();
  await scheduleCache.set(cacheKey, freshSchedule);
}
```

---

## Cache Key Conventions

### Schedule Cache
```typescript
function getScheduleCacheKey(params: { season: string; division: string; team: string }): string {
  const { season, division, team } = params;
  return `schedule:${season}:${division.replace(/\s+/g, '-')}:${team}`;
}

// Example: "schedule:2025/2026:14U-B:jr-kings-1"
```

### Team Stats Cache
```typescript
function getTeamStatsCacheKey(params: { season: string; division: string; team: string }): string {
  const { season, division, team } = params;
  return `stats:team:${season}:${division.replace(/\s+/g, '-')}:${team}`;
}

// Example: "stats:team:2025/2026:14U-B:jr-kings-1"
```

### Player Stats Cache
```typescript
function getPlayerStatsCacheKey(params: { season: string; division: string; team: string; player: string }): string {
  const { season, division, team, player } = params;
  const playerSlug = player.toLowerCase().replace(/\s+/g, '-');
  return `stats:player:${season}:${division.replace(/\s+/g, '-')}:${team}:${playerSlug}`;
}

// Example: "stats:player:2025/2026:14U-B:jr-kings-1:johnny-smith"
```

---

## Cache Invalidation Strategy

### Manual Invalidation (P1)
- User action: "Refresh schedule" button in UI
- Calls: `await scheduleCache.clear()` or `await scheduleCache.delete(cacheKey)`

### TTL-Based Expiration (P1 & P2)
- Default: 24 hours for all cache types
- Rationale: SCAHA schedules rarely change once published
- Configurable per cache entry via `set(key, data, ttl)`

### Scheduled Refresh (P2 with Supabase)
- Vercel Cron Job: Daily at 3:00 AM PT
- Clears all cache entries
- Next user query triggers fresh fetch from SCAHA MCP

```typescript
// app/api/cron/clear-cache/route.ts
import { scheduleCache, teamStatsCache, playerStatsCache } from '@/lib/cache';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await Promise.all([
    scheduleCache.clear(),
    teamStatsCache.clear(),
    playerStatsCache.clear(),
  ]);

  return new Response('Cache cleared', { status: 200 });
}
```

---

## Performance Characteristics

### In-Memory Cache (P1)
- **Read Latency**: <1ms (Map lookup)
- **Write Latency**: <1ms (Map insert)
- **Persistence**: None (cold start resets)
- **Scalability**: Single serverless instance only

### Supabase Cache (P2)
- **Read Latency**: 10-50ms (network + DB query)
- **Write Latency**: 10-50ms (network + DB upsert)
- **Persistence**: Full (survives cold starts)
- **Scalability**: Shared across all serverless instances

### Response Time Impact
- **Memory Cache Hit**: <1s total (cache lookup + AI formatting)
- **Supabase Cache Hit**: <1.5s total (DB query + AI formatting)
- **Cache Miss**: <3s total (MCP fetch + cache write + AI formatting)

All targets meet constitution requirement: <3s for 95th percentile queries.

---

## Testing

### Test Cases

**TC1: Memory Cache - Set and Get**
```typescript
const cache = new MemoryCacheProvider<ScheduleData>();
await cache.set('test-key', scheduleData);
const result = await cache.get('test-key');
expect(result).toEqual(scheduleData);
```

**TC2: Memory Cache - Expiration**
```typescript
await cache.set('test-key', scheduleData, 100); // 100ms TTL
await sleep(200);
const result = await cache.get('test-key');
expect(result).toBeNull();
```

**TC3: Supabase Cache - Persistence**
```typescript
const cache1 = new SupabaseCacheProvider<ScheduleData>('cache_schedule');
await cache1.set('test-key', scheduleData);

const cache2 = new SupabaseCacheProvider<ScheduleData>('cache_schedule'); // New instance
const result = await cache2.get('test-key');
expect(result).toEqual(scheduleData);
```

**TC4: Provider Factory - Switching**
```typescript
process.env.CACHE_PROVIDER = 'memory';
const memoryCache = createCacheProvider<ScheduleData>('schedule');
expect(memoryCache).toBeInstanceOf(MemoryCacheProvider);

process.env.CACHE_PROVIDER = 'supabase';
const supabaseCache = createCacheProvider<ScheduleData>('schedule');
expect(supabaseCache).toBeInstanceOf(SupabaseCacheProvider);
```

---

## Migration Checklist

### Phase 1 → Phase 2 Migration

1. ✅ Implement `MemoryCacheProvider` (P1)
2. ✅ Test with in-memory cache in production
3. ⬜ Create Supabase project and configure environment variables
4. ⬜ Run Supabase schema migration (create cache tables)
5. ⬜ Implement `SupabaseCacheProvider` (P2)
6. ⬜ Test locally with `CACHE_PROVIDER=supabase`
7. ⬜ Deploy to Vercel with Supabase environment variables
8. ⬜ Update Vercel environment: `CACHE_PROVIDER=supabase`
9. ⬜ Monitor performance and error rates
10. ⬜ Remove `MemoryCacheProvider` code (optional cleanup)

**Zero Downtime**: Factory pattern allows switching providers without code changes or redeployment.
