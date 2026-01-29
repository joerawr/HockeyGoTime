# Data Model: Google Maps Directions Link

**Feature**: 007-add-clickable-google
**Created**: 2025-10-17

## Overview

This feature adds a single field to an existing type. No new entities or database changes required.

## Type Changes

### TravelCalculation Interface

**File**: `types/travel.ts`

**Existing Interface**:
```typescript
export interface TravelCalculation {
  // Source Data
  game: Game;
  userPreferences: UserPreferences;

  // Route Information
  venueAddress: string;
  travelDurationSeconds: number;
  distanceMeters: number;

  // Calculated Times (ISO 8601 timestamps)
  gameTime: string;
  arrivalTime: string;
  departureTime: string;
  wakeUpTime: string;

  // Metadata
  calculatedAt: string;
  trafficCondition?: 'light' | 'moderate' | 'heavy';
  isEstimated?: boolean;
  estimateMethod?: 'distance';
  disclaimer?: string;
}
```

**New Field**:
```typescript
export interface TravelCalculation {
  // ... all existing fields above ...

  // NEW: Google Maps directions URL
  mapsUrl?: string;
}
```

**Field Details**:

| Field | Type | Required | Description | Example Value |
|-------|------|----------|-------------|---------------|
| `mapsUrl` | `string` | No | Google Maps Directions API URL with origin and destination pre-populated | `"https://www.google.com/maps/dir/?api=1&origin=123+Main+St%2C+Irvine%2C+CA&destination=9+Journey%2C+Aliso+Viejo%2C+CA&travelmode=driving"` |

**Validation Rules**:
- Must be a valid URL (starts with `https://www.google.com/maps/dir/`)
- Must include `api=1` parameter (required by Google Maps Directions API)
- Must include properly URL-encoded `origin` and `destination` parameters
- Must include `travelmode=driving` parameter

**Generation Logic**:
```typescript
const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
  `&origin=${encodeURIComponent(userPreferences.homeAddress)}` +
  `&destination=${encodeURIComponent(options.venueAddress)}` +
  `&travelmode=driving`;
```

## State Transitions

N/A - This is a stateless calculated value (generated on-demand during travel calculations).

## Relationships

**Dependencies**:
- `userPreferences.homeAddress` - Used as Maps origin
- `options.venueAddress` - Used as Maps destination (from venue resolution system)

**Consumers**:
- AI chat agent (includes link in responses)
- Chat UI (renders as markdown clickable link)

## No Database Changes

This feature does not require any database schema changes. The `mapsUrl` is calculated in-memory during each travel time request.
