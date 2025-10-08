# API Contract: Google Maps Routes API v2

**Service**: Google Maps Routes API v2
**Endpoint**: `https://routes.googleapis.com/directions/v2:computeRoutes`
**Purpose**: Calculate travel time and distance with traffic-aware routing for game departure planning

---

## Authentication

**Method**: API Key via HTTP header

**Header**:
```
X-Goog-Api-Key: {GOOGLE_MAPS_API_KEY}
```

**Environment Variable**: `GOOGLE_MAPS_API_KEY` (already available, tested by user)

---

## Request Specification

### HTTP Method
`POST`

### Headers
```
Content-Type: application/json
X-Goog-Api-Key: {API_KEY}
X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline
```

**Field Mask**: Limits response to only requested fields (reduces payload size and cost)

### Request Body

```typescript
interface ComputeRoutesRequest {
  origin: {
    address: string;          // Full address, e.g., "123 Main St, Los Angeles, CA 90001"
  };
  destination: {
    address: string;          // Venue address, e.g., "300 W Lincoln Ave, Anaheim, CA 92805"
  };
  travelMode: 'DRIVE';        // Fixed: always driving
  routingPreference: 'TRAFFIC_AWARE_OPTIMAL'; // Use real-time and historical traffic
  arrivalTime: string;        // ISO 8601 with timezone, e.g., "2025-10-05T07:00:00-07:00"
  computeAlternativeRoutes: boolean; // false for single best route
  languageCode: 'en-US';      // English, US locale
  units: 'IMPERIAL';          // Miles, feet (US standard)
}
```

**Example Request**:
```json
{
  "origin": {
    "address": "123 Main St, Los Angeles, CA 90001"
  },
  "destination": {
    "address": "300 W Lincoln Ave, Anaheim, CA 92805"
  },
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE_OPTIMAL",
  "arrivalTime": "2025-10-05T07:00:00-07:00",
  "computeAlternativeRoutes": false,
  "languageCode": "en-US",
  "units": "IMPERIAL"
}
```

---

## Response Specification

### Success Response (200 OK)

```typescript
interface RouteResponse {
  routes: Array<{
    duration: string;        // Duration in seconds with 's' suffix, e.g., "3600s"
    distanceMeters: number;  // Distance in meters, e.g., 45000
    polyline?: {
      encodedPolyline: string; // Encoded polyline for map rendering (optional)
    };
  }>;
}
```

**Example Response**:
```json
{
  "routes": [
    {
      "duration": "3600s",
      "distanceMeters": 45000,
      "polyline": {
        "encodedPolyline": "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      }
    }
  ]
}
```

**Field Descriptions**:
- `duration`: Travel time as string with 's' suffix (e.g., "3600s" = 1 hour). Must parse integer.
- `distanceMeters`: Distance in meters. Convert to miles: `meters * 0.000621371`
- `polyline.encodedPolyline`: Google Polyline encoding (optional, for map visualization)

**Data Parsing**:
```typescript
function parseDuration(duration: string): number {
  // "3600s" → 3600 (seconds)
  return parseInt(duration.replace('s', ''), 10);
}

function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}
```

---

### Error Responses

#### 400 Bad Request
**Cause**: Invalid request (malformed address, invalid date, etc.)

**Example**:
```json
{
  "error": {
    "code": 400,
    "message": "Invalid address: 'xyz123'",
    "status": "INVALID_ARGUMENT"
  }
}
```

**Handling**: Return user-friendly error ("Could not find address, please check and try again")

#### 401 Unauthorized
**Cause**: Invalid or missing API key

**Example**:
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid",
    "status": "UNAUTHENTICATED"
  }
}
```

**Handling**: Log error, return generic error to user (do not expose API key issue)

#### 429 Too Many Requests
**Cause**: Rate limit exceeded

**Example**:
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Handling**: Cache aggressively, implement retry with exponential backoff

#### 500 Internal Server Error
**Cause**: Google service issue

**Handling**: Fallback to distance-based estimate (use straight-line distance * 1.3 for road distance approximation)

---

## Implementation Notes

### arrivalTime Parameter
- **Critical**: Must use `arrivalTime` (not `departureTime`) for accurate traffic prediction
- Google predicts traffic conditions at the specified arrival time and calculates departure time backwards
- Format: ISO 8601 with timezone (e.g., `2025-10-05T07:00:00-07:00`)
- Timezone: Use game's timezone (from `Game.timezone`, typically "America/Los_Angeles" for SCAHA)

**Calculation Flow**:
```typescript
// User asks: "When do I need to leave for Sunday's game?"
const game = getNextGame(userPrefs.team); // From SCAHA MCP
const gameDateTime = new Date(`${game.date}T${game.time}:00`); // e.g., "2025-10-05T07:00:00"
const timezoneOffset = getTimezoneOffset(game.timezone); // e.g., "-07:00"
const arrivalTime = `${game.date}T${game.time}:00${timezoneOffset}`; // "2025-10-05T07:00:00-07:00"

const route = await computeRoute({
  originAddress: userPrefs.homeAddress,
  destinationAddress: getVenueAddress(game.venue), // Hardcoded lookup for Capstone
  arrivalTime
});

const travelSeconds = parseDuration(route.routes[0].duration);
const departureTime = new Date(gameDateTime.getTime() - (userPrefs.arrivalBufferMinutes * 60 * 1000) - (travelSeconds * 1000));
const wakeUpTime = new Date(departureTime.getTime() - (userPrefs.prepTimeMinutes * 60 * 1000));
```

### Caching Strategy
- **Cache Key**: `route:{originAddress}:{destinationAddress}:{arrivalTime}`
- **TTL**: 6 hours (traffic patterns change throughout day)
- **Rationale**: Routes API costs $0.005 per request. Aggressive caching for same game reduces cost.

### Fallback Strategy
If Routes API fails:
1. Calculate straight-line distance using Haversine formula
2. Multiply by 1.3 (road distance approximation factor)
3. Use average speed: 30 mph (conservative for traffic)
4. Add 20% buffer for uncertainty
5. Return calculated time with disclaimer: "Estimated travel time (traffic data unavailable)"

---

## Testing

### Test Cases

**TC1: Successful Route Calculation**
- Origin: "123 Main St, Los Angeles, CA 90001"
- Destination: "300 W Lincoln Ave, Anaheim, CA 92805"
- Arrival Time: "2025-10-05T07:00:00-07:00"
- Expected: `duration` > 0, `distanceMeters` > 0

**TC2: Invalid Origin Address**
- Origin: "xyz123 invalid address"
- Expected: 400 Bad Request error

**TC3: Past Arrival Time**
- Arrival Time: "2020-01-01T07:00:00-07:00"
- Expected: May return 400 or use current traffic (API behavior varies)

**TC4: Same Origin and Destination**
- Origin: "300 W Lincoln Ave, Anaheim, CA 92805"
- Destination: "300 W Lincoln Ave, Anaheim, CA 92805"
- Expected: `duration: "0s"`, `distanceMeters: 0`

---

## Rate Limits and Quotas

**Free Tier**: $200/month credit (~40,000 requests at $0.005 each)

**Quota Management**:
- Cache aggressively (6-hour TTL for routes)
- Only calculate on explicit user request (not preemptively)
- Monitor usage via Google Cloud Console

**Cost Optimization**:
- Use Field Mask to request only needed fields
- Do not request alternative routes
- Cache repeated queries (same game, same user)

---

## References

- [Google Routes API Documentation](https://developers.google.com/maps/documentation/routes/overview)
- [Compute Routes API Reference](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes)
- [User-Provided Python Example](../research.md#2-google-maps-routes-api-v2-integration)
