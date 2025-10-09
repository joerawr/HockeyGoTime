# Phase 1: Data Model - Hockey Go Time

**Feature**: 001-hockey-go-time | **Date**: 2025-10-07 | **Plan**: [plan.md](./plan.md)

## Entity Definitions

This document defines the core data entities for the Hockey Go Time travel planning and stats enhancement features. All entities are TypeScript interfaces representing domain concepts, not database schemas (storage is localStorage and cache layers).

---

## 1. User Preferences

**Purpose**: Stores user's hockey team, home location, and timing preferences for personalized queries and travel calculations.

**Storage**: Client-side localStorage (no authentication, per-browser persistence)

**Entity**:
```typescript
interface UserPreferences {
  // Team Identity
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Location & Travel
  homeAddress: string;       // Full address for geocoding, e.g., "123 Main St, Los Angeles, CA 90001"

  // Timing Preferences
  prepTimeMinutes: number;   // Minutes needed to get ready, default: 30
  arrivalBufferMinutes: number; // Minutes before game time to arrive, default: 30

  // Hotel Feature (deferred post-Capstone)
  minWakeUpTime?: string;    // Optional, e.g., "06:00" (24-hour format)
}
```

**Validation Rules**:
- `team`: Non-empty string, normalized by AI (e.g., "jr kings 1" → "Jr. Kings (1)")
- `division`: Non-empty string, normalized by AI (e.g., "14B" → "14U B")
- `season`: Format "YYYY/YYYY", defaults to current season
- `homeAddress`: Non-empty string, validated by Google Maps geocoding
- `prepTimeMinutes`: Integer, min: 0, max: 240 (4 hours), default: 30
- `arrivalBufferMinutes`: Integer, min: 0, max: 120 (2 hours), default: 30
- `minWakeUpTime`: Optional, format "HH:MM" (24-hour), if present min: "04:00", max: "12:00"

**Relationships**:
- None (leaf entity)

---

## 2. Schedule Data (from SCAHA MCP)

**Purpose**: Represents hockey game schedule data returned by SCAHA MCP `get_schedule` tool.

**Storage**: Cached (Phase 1: in-memory, Phase 2: Supabase)

**Entity**:
```typescript
interface Game {
  // Identifiers
  id: string;                // Unique game identifier, e.g., "2025-10-05-14UB-jrkings1-ochockey1"

  // Teams
  homeTeam: string;          // e.g., "Jr. Kings (1)"
  awayTeam: string;          // e.g., "OC Hockey (1)"
  homeJersey: string;        // e.g., "Dark"
  awayJersey: string;        // e.g., "White"

  // Timing
  date: string;              // ISO 8601 date, e.g., "2025-10-05"
  time: string;              // 24-hour format, e.g., "07:00"
  timezone: string;          // e.g., "America/Los_Angeles"

  // Location
  venue: string;             // Venue name from SCAHA, e.g., "Anaheim Ice"
  rink?: string;             // Optional rink number, e.g., "Rink 1"

  // Metadata
  season: string;            // e.g., "2025/2026"
  division: string;          // e.g., "14U B"
  gameType?: string;         // e.g., "Regular Season", "Playoff"
}

interface ScheduleData {
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"
  games: Game[];             // Array of games
  lastUpdated: string;       // ISO 8601 timestamp
}
```

**Validation Rules**:
- `id`: Non-empty string, unique per game
- `date`: ISO 8601 date format (YYYY-MM-DD)
- `time`: 24-hour format (HH:MM)
- `timezone`: IANA timezone identifier
- `venue`: Non-empty string (maps to address via hardcoded lookup for Capstone)

**Relationships**:
- Referenced by `TravelCalculation.game`

---

## 3. Travel Calculation

**Purpose**: Represents calculated travel logistics for a specific game (wake-up time, departure time, travel duration).

**Storage**: Ephemeral (calculated on-demand, not persisted)

**Entity**:
```typescript
interface TravelCalculation {
  // Source Data
  game: Game;                       // The game being calculated for
  userPreferences: UserPreferences; // User's preferences used in calculation

  // Route Information
  venueAddress: string;             // Resolved venue address (hardcoded for Capstone)
  travelDurationSeconds: number;    // Travel time in seconds (from Google Routes API)
  distanceMeters: number;           // Distance in meters

  // Calculated Times (all ISO 8601 timestamps with timezone)
  gameTime: string;                 // e.g., "2025-10-05T07:00:00-07:00"
  arrivalTime: string;              // gameTime - arrivalBufferMinutes
  departureTime: string;            // arrivalTime - travelDuration
  wakeUpTime: string;               // departureTime - prepTimeMinutes

  // Metadata
  calculatedAt: string;             // ISO 8601 timestamp when calculation performed
  trafficCondition?: 'light' | 'moderate' | 'heavy'; // Optional traffic indicator
}
```

**Validation Rules**:
- `venueAddress`: Non-empty string, geocodable by Google Maps
- `travelDurationSeconds`: Integer, min: 0
- `distanceMeters`: Integer, min: 0
- All timestamps: ISO 8601 with timezone

**Relationships**:
- Composed of `Game` and `UserPreferences`
- Uses `VenueAddressMapping` for address resolution (Capstone hardcoded)

---

## 4. Player Stats (from SCAHA MCP)

**Purpose**: Represents individual player statistics for a season.

**Storage**: Cached (Phase 1: in-memory, Phase 2: Supabase)

**Entity**:
```typescript
interface PlayerStats {
  // Identity
  playerName: string;        // e.g., "Johnny Smith"
  playerNumber?: number;     // Optional jersey number
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Stats (for forwards/defensemen)
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;

  // Goalie Stats (if position is goalie)
  goalie?: {
    saves: number;
    shotsAgainst: number;
    goalsAgainst: number;
    savePercentage: number;  // 0.0 - 1.0
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
  };

  // Metadata
  position?: 'Forward' | 'Defense' | 'Goalie';
  lastUpdated: string;       // ISO 8601 timestamp
}
```

**Validation Rules**:
- `playerName`: Non-empty string
- All numeric stats: Integer, min: 0
- `savePercentage`: Float, min: 0.0, max: 1.0
- `goalie`: Required if `position === 'Goalie'`, otherwise null

**Relationships**:
- None (leaf entity, cached separately from schedule)

---

## 5. Team Stats (from SCAHA MCP)

**Purpose**: Represents team performance statistics and league standing.

**Storage**: Cached (Phase 1: in-memory, Phase 2: Supabase)

**Entity**:
```typescript
interface TeamStats {
  // Identity
  team: string;              // e.g., "Jr. Kings (1)"
  division: string;          // e.g., "14U B"
  season: string;            // e.g., "2025/2026"

  // Record
  wins: number;
  losses: number;
  ties: number;
  overtimeLosses?: number;   // Optional, if tracked by league

  // Scoring
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;  // goalsFor - goalsAgainst

  // League Standing
  points: number;            // Typically: wins * 2 + ties + OTL
  leagueRank?: number;       // Position in division (1 = first place)

  // Metadata
  lastUpdated: string;       // ISO 8601 timestamp
}
```

**Validation Rules**:
- All numeric stats: Integer, min: 0
- `goalDifferential`: Can be negative
- `leagueRank`: Integer, min: 1

**Relationships**:
- None (leaf entity, cached separately from schedule)

---

## 6. Cache Entry (Generic)

**Purpose**: Wrapper for cached data with TTL and metadata.

**Storage**: In-memory Map (Phase 1) or Supabase table (Phase 2)

**Entity**:
```typescript
interface CacheEntry<T> {
  key: string;               // Cache key, e.g., "schedule:2025/2026:14U-B:jr-kings-1"
  data: T;                   // The cached data (ScheduleData, PlayerStats, TeamStats)
  timestamp: number;         // Unix timestamp (milliseconds) when cached
  ttl: number;               // Time-to-live in milliseconds, default: 86400000 (24 hours)
}
```

**Validation Rules**:
- `key`: Non-empty string, follows pattern `{type}:{param1}:{param2}:{...}`
- `timestamp`: Integer, positive
- `ttl`: Integer, positive

**Relationships**:
- Generic wrapper for `ScheduleData`, `PlayerStats`, `TeamStats`

---

## 7. Venue Address Mapping (Capstone Hardcoded)

**Purpose**: Maps SCAHA venue names to physical addresses for travel calculations.

**Storage**: Hardcoded in system prompt (`components/agent/hockey-prompt.ts`)

**Entity** (for documentation only, not persisted):
```typescript
interface VenueAddressMapping {
  venueName: string;         // e.g., "Anaheim Ice"
  address: string;           // e.g., "300 W Lincoln Ave, Anaheim, CA 92805"
  alias?: string[];          // Optional alternate names, e.g., ["The Rinks - Anaheim"]
}
```

**Implementation Pattern**:
```typescript
const VENUE_MAPPINGS: Record<string, string> = {
  'Anaheim Ice': '300 W Lincoln Ave, Anaheim, CA 92805',
  'Great Park Ice': '888 Ridge Valley, Irvine, CA 92618',
  // ... more venues from user-provided list
};
```

**Post-Capstone**: Replace with database table and LLM-based deduplication/search pipeline.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│  UserPreferences    │ (localStorage)
│  - team             │
│  - homeAddress      │
│  - prepTimeMinutes  │
└─────────────────────┘
          │
          │ (used by)
          ▼
┌─────────────────────┐      ┌──────────────────┐
│  TravelCalculation  │◄─────│  Game            │ (cached)
│  - wakeUpTime       │      │  - date          │
│  - departureTime    │      │  - venue         │
│  - travelDuration   │      └──────────────────┘
└─────────────────────┘               │
          │                           │ (part of)
          │ (uses)                    ▼
          ▼                  ┌──────────────────┐
┌─────────────────────┐     │  ScheduleData    │ (cached)
│ VenueAddressMapping │     │  - team          │
│ (hardcoded prompt)  │     │  - games[]       │
└─────────────────────┘     └──────────────────┘

┌─────────────────────┐     ┌──────────────────┐
│  PlayerStats        │     │  TeamStats       │ (both cached)
│  - goals/assists    │     │  - wins/losses   │
└─────────────────────┘     └──────────────────┘
```

---

## Type System Organization

**Proposed File Structure**:
```
types/
├── preferences.ts      # UserPreferences
├── schedule.ts         # Game, ScheduleData
├── stats.ts            # PlayerStats, TeamStats
├── travel.ts           # TravelCalculation, VenueAddressMapping
└── cache.ts            # CacheEntry<T>
```

**Shared Validation Utilities**:
```typescript
// lib/validation/date-time.ts
export function validateISODate(date: string): boolean;
export function validateTime24Hour(time: string): boolean;
export function parseGameDateTime(game: Game): Date;

// lib/validation/preferences.ts
export function validatePreferences(prefs: UserPreferences): string[]; // returns errors
export function normalizeTeamName(input: string): string;
export function normalizeDivision(input: string): string;
```

---

## Next Steps

1. Create TypeScript type definitions in `types/` directory
2. Generate API contracts for Google Routes API integration
3. Define cache provider interface for in-memory/Supabase abstraction
