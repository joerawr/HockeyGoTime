# Quickstart: Google Maps Directions Link Feature

**Feature**: 007-add-clickable-google
**Created**: 2025-10-17

## Overview

This feature adds a clickable Google Maps link to all travel time responses, making it easy for users to get directions without manually copying addresses.

## User Flow

1. **User asks for travel time**:
   ```
   User: "What time should we leave for Sunday's game at Aliso Viejo Ice?"
   ```

2. **AI provides travel calculation with Maps link**:
   ```
   You should leave by 1:08 PM for Sunday's game.

   **Game Day:** Sunday, October 12th — Jr. Kings (1) at Avalanche
   **Venue:** Aliso Viejo Ice (Rink 1)
   **Venue address:** 9 Journey, Aliso Viejo, CA 92656

   **Game time:** 3:00 PM
   **Planned arrival time:** 1:57 PM
   **Get ready time:** 12:38 PM
   **Departure time:** 1:08 PM
   **Expected drive duration:** 49 minutes

   🗺️ [Get directions in Google Maps](https://www.google.com/maps/dir/?api=1&origin=123+Main+St%2C+Irvine%2C+CA&destination=9+Journey%2C+Aliso+Viejo%2C+CA&travelmode=driving)
   ```

3. **User clicks link**:
   - **Desktop**: Opens Google Maps in browser with directions pre-loaded
   - **Mobile (with Maps app)**: Opens Google Maps app with directions
   - **Mobile (without Maps app)**: Opens Google Maps web version

## Implementation Details

### Files Modified

1. **`types/travel.ts`** - Add `mapsUrl` field
2. **`lib/travel/time-calculator.ts`** - Generate Maps URL
3. **`components/agent/hockey-prompt.ts`** - Instruct AI to include link
4. **`components/agent/pghl-prompt.ts`** - Instruct AI to include link (PGHL uses same travel calculator)

### Example Code

**Generate Maps URL** (`lib/travel/time-calculator.ts`):

```typescript
export async function calculateTravelTimes(
  game: Game,
  userPreferences: UserPreferences,
  options: CalculateTravelTimesOptions
): Promise<TravelCalculation> {
  // ... existing travel calculation logic ...

  // Generate Google Maps directions URL
  const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(userPreferences.homeAddress)}` +
    `&destination=${encodeURIComponent(options.venueAddress)}` +
    `&travelmode=driving`;

  return {
    game,
    userPreferences,
    venueAddress: options.venueAddress,
    travelDurationSeconds: route.durationSeconds,
    distanceMeters: route.distanceMeters,
    gameTime: formatISO(gameDateTime, timezone),
    arrivalTime: formatISO(arrivalTime, timezone),
    departureTime: formatISO(departureTime, timezone),
    wakeUpTime: formatISO(wakeUpTime, timezone),
    calculatedAt: new Date().toISOString(),
    isEstimated: route.isFallback ?? false,
    estimateMethod: route.isFallback ? 'distance' : undefined,
    disclaimer: route.disclaimer,
    mapsUrl, // NEW field
  };
}
```

**Update System Prompt** (`components/agent/hockey-prompt.ts`):

```typescript
// Add to travel time instructions section:
When providing travel time calculations, ALWAYS include the Google Maps link
at the end of your response using this format:

🗺️ [Get directions in Google Maps](MAPS_URL_FROM_CALCULATION)

This makes it easy for users to navigate on game day.
```

### Testing Checklist

- [ ] Desktop browser: Link opens Google Maps web with correct addresses
- [ ] Mobile iOS: Link opens Google Maps app (if installed) or web
- [ ] Mobile Android: Link opens Google Maps app (if installed) or web
- [ ] Special characters: Test address with "#", "&", spaces encode correctly
- [ ] Long addresses: Full street addresses work
- [ ] TypeScript: `pnpm tsc --noEmit` passes with zero errors

## Edge Cases

### User Without Home Address
- **Scenario**: User hasn't saved home address in preferences
- **Behavior**: Travel calculation fails (existing behavior)
- **Maps Link**: Not generated (no origin address available)

### Invalid Venue Address
- **Scenario**: Venue address cannot be resolved
- **Behavior**: Travel calculation shows disclaimer (existing behavior)
- **Maps Link**: Generated anyway (Google Maps will attempt to geocode)

### Special Characters in Address
- **Example**: "The Rinks - Anaheim ICE (Rink #2)"
- **Handling**: `encodeURIComponent()` handles all special chars
- **Result**: `The+Rinks+-+Anaheim+ICE+%28Rink+%232%29`

## Google Maps URL Format Reference

**Standard Format**:
```
https://www.google.com/maps/dir/?api=1&origin=ADDRESS1&destination=ADDRESS2&travelmode=driving
```

**Parameters**:
- `api=1` - Required by Google Maps Directions API
- `origin` - Starting address (URL-encoded)
- `destination` - Ending address (URL-encoded)
- `travelmode` - `driving`, `walking`, `bicycling`, or `transit` (we use `driving`)

**Deep-Linking Behavior**:
- iOS: Opens Google Maps app if installed, else Safari
- Android: Opens Google Maps app if installed, else Chrome
- Desktop: Opens maps.google.com in default browser

**Documentation**: https://developers.google.com/maps/documentation/urls/get-started#directions-action

## Deployment

1. **Development**: Test locally with `pnpm dev`
2. **Type Check**: Run `pnpm tsc --noEmit`
3. **Commit**: Push to `007-add-clickable-google` branch
4. **Deploy**: Merge to `main` → Vercel auto-deploys
5. **Verify**: Test on production (hockeygotime.net)

No environment variables or configuration changes required!
