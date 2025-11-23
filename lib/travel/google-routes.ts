/**
 * Google Routes API client
 * Handles TRAFFIC_AWARE_OPTIMAL route calculations for travel planning.
 *
 * For live traffic predictions we call the Routes API with different
 * traffic models to approximate the same "range" Google Maps shows
 * in the UI (e.g., "40–55 min"). We then:
 *   - Use the HIGH end of that range for departure / wake-up times
 *   - Still expose the full range so the assistant can show it
 */

import { toUTC } from '@/lib/utils/timezone';

import type { ComputeRoutesRequest, RouteResponse } from '@/types/travel';

// Google Routes API endpoint (Directions API v2)
const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';

// Field mask limits the response payload to the data we actually need
const FIELD_MASK =
  'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

const ROAD_DISTANCE_FACTOR = 1.3; // estimate road distance from straight-line distance
const AVERAGE_SPEED_MPH = 30; // conservative assumption for SoCal traffic
const ESTIMATE_BUFFER_MULTIPLIER = 1.2; // add 20% buffer for uncertainty
const MILES_TO_METERS = 1609.344;
const FALLBACK_DISCLAIMER = 'Estimated travel time (traffic data unavailable)';

type TrafficModel = NonNullable<ComputeRoutesRequest['trafficModel']>;
const DEFAULT_TRAFFIC_MODEL: TrafficModel = 'PESSIMISTIC';

interface LatLng {
  lat: number;
  lng: number;
}

interface ComputeRouteParams {
  originAddress: string;
  destinationAddress: string;
  /**
   * Target arrival time expressed in the user's local timezone (ISO 8601 string)
   * Used to calculate departure time for traffic-aware routing
   * Example: "2025-10-05T07:00:00-07:00"
   */
  arrivalTimeLocalISO: string;
  /**
   * User's timezone (defaults to America/Los_Angeles for Capstone scope)
   */
  timezone?: string;
}

interface ComputeRouteResult {
  durationSeconds: number;
  distanceMeters: number;
  encodedPolyline?: string;
  isFallback?: boolean;
  disclaimer?: string;
  /**
   * Optional duration range derived from multiple Google traffic models.
   * - low: shortest plausible drive time (optimistic/best-guess)
   * - high: longest plausible drive time (pessimistic) → used for leave-by time
   */
  durationRangeSeconds?: {
    low: number;
    high: number;
    optimistic?: number;
    bestGuess?: number;
    pessimistic?: number;
  };
}

/**
 * Parse the Google Routes API duration string (e.g., "3720s") into seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)s$/);
  if (!match) {
    throw new Error(`Unexpected duration format returned by Google Routes API: ${duration}`);
  }
  return Number.parseInt(match[1], 10);
}

/**
 * Build a ComputeRoutesRequest payload from calling parameters
 */
function buildRequestPayload(
  originAddress: string,
  destinationAddress: string,
  departureTimeLocalISO?: string,
  timezone?: string,
  trafficModel: TrafficModel = DEFAULT_TRAFFIC_MODEL
): ComputeRoutesRequest {
  const payload: ComputeRoutesRequest = {
    origin: { address: originAddress },
    destination: { address: destinationAddress },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    trafficModel,
    computeAlternativeRoutes: false,
    languageCode: 'en-US',
    units: 'IMPERIAL',
  };

  // Only set departureTime if provided (otherwise API defaults to now)
  if (departureTimeLocalISO) {
    const departureUTC = toUTC(departureTimeLocalISO, timezone);
    payload.departureTime = departureUTC.toISOString();
  }

  return payload;
}

// Convergence settings for iterative departure time calculation
const INITIAL_ESTIMATE_MINUTES = 45;
const CONVERGENCE_THRESHOLD_SECONDS = 300; // 5 minutes
const MAX_ITERATIONS = 2;

/**
 * Call Google Routes API with iterative convergence to get accurate
 * traffic-aware duration for a future departure time.
 *
 * Algorithm:
 * 1. Estimate departure time (arrival - 45 min initial guess)
 * 2. Get traffic-aware duration for that departure time
 * 3. If |estimate - actual| > 5 min, refine and retry once
 *
 * @throws Error if the request fails or returns an unexpected shape.
 */
export async function computeRoute(params: ComputeRouteParams): Promise<ComputeRouteResult> {
  const { originAddress, destinationAddress, arrivalTimeLocalISO, timezone } = params;

  try {
    // Convert arrival time to Date for calculations
    const arrivalTime = new Date(arrivalTimeLocalISO);
    if (Number.isNaN(arrivalTime.getTime())) {
      throw new Error(`Invalid arrival time: ${arrivalTimeLocalISO}`);
    }

    // Iteration 1: Initial estimate using BEST_GUESS traffic model
    let estimatedDurationSeconds = INITIAL_ESTIMATE_MINUTES * 60;
    let departureTime = new Date(arrivalTime.getTime() - estimatedDurationSeconds * 1000);

    let bestGuessResult = await requestRoutesApi(
      originAddress,
      destinationAddress,
      departureTime.toISOString(),
      timezone,
      'BEST_GUESS'
    );

    // Iteration 2: Refine if needed
    const diff = Math.abs(bestGuessResult.durationSeconds - estimatedDurationSeconds);
    if (diff > CONVERGENCE_THRESHOLD_SECONDS) {
      // Recalculate departure time with actual duration
      departureTime = new Date(
        arrivalTime.getTime() - bestGuessResult.durationSeconds * 1000
      );
      bestGuessResult = await requestRoutesApi(
        originAddress,
        destinationAddress,
        departureTime.toISOString(),
        timezone,
        'BEST_GUESS'
      );
    }

    // After convergence, optionally compute a duration range using multiple traffic models
    // so we can show parents the same kind of "40–55 min" window Google Maps displays.
    const finalDepartureISO = departureTime.toISOString();
    let result: ComputeRouteResult = bestGuessResult;

    try {
      const [optimistic, pessimistic] = await Promise.all([
        requestRoutesApi(
          originAddress,
          destinationAddress,
          finalDepartureISO,
          timezone,
          'OPTIMISTIC'
        ),
        requestRoutesApi(
          originAddress,
          destinationAddress,
          finalDepartureISO,
          timezone,
          'PESSIMISTIC'
        ),
      ]);

      const low = Math.min(
        result.durationSeconds,
        optimistic.durationSeconds,
        pessimistic.durationSeconds
      );
      const high = Math.max(
        result.durationSeconds,
        optimistic.durationSeconds,
        pessimistic.durationSeconds
      );

      result = {
        ...result,
        durationRangeSeconds: {
          low,
          high,
          bestGuess: result.durationSeconds,
          optimistic: optimistic.durationSeconds,
          pessimistic: pessimistic.durationSeconds,
        },
      };
    } catch (rangeError) {
      console.warn('[travel] Google Routes API range calculation failed:', rangeError);
    }

    return result;
  } catch (error) {
    console.warn('[travel] Google Routes API failed, attempting fallback estimate.');

    try {
      return await estimateRouteFromDistance(params);
    } catch (fallbackError) {
      console.error('[travel] Fallback distance-based estimate also failed.');
      // Re-throw original error to preserve context for callers
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}

async function requestRoutesApi(
  originAddress: string,
  destinationAddress: string,
  departureTimeISO: string,
  timezone?: string,
  trafficModel: TrafficModel = DEFAULT_TRAFFIC_MODEL
): Promise<ComputeRouteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  const requestBody = buildRequestPayload(
    originAddress,
    destinationAddress,
    departureTimeISO,
    timezone,
    trafficModel
  );

  const response = await fetch(ROUTES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': FIELD_MASK,
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Google Routes API error (status ${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as RouteResponse;

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Google Routes API returned no routes');
  }

  const [route] = data.routes;

  return {
    durationSeconds: parseDuration(route.duration),
    distanceMeters: route.distanceMeters,
    encodedPolyline: route.polyline?.encodedPolyline,
  };
}

async function estimateRouteFromDistance(params: ComputeRouteParams): Promise<ComputeRouteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  const [origin, destination] = await Promise.all([
    geocodeAddress(params.originAddress, apiKey),
    geocodeAddress(params.destinationAddress, apiKey),
  ]);

  const straightLineMiles = haversineDistanceMiles(origin, destination);
  if (!Number.isFinite(straightLineMiles)) {
    throw new Error('Unable to calculate straight-line distance between addresses');
  }

  const roadDistanceMiles = straightLineMiles * ROAD_DISTANCE_FACTOR;
  const travelHours = roadDistanceMiles / AVERAGE_SPEED_MPH;
  const bufferedTravelSeconds = Math.max(
    Math.round(travelHours * ESTIMATE_BUFFER_MULTIPLIER * 3600),
    5 * 60 // ensure at least five minutes to avoid zero-duration routes
  );

  return {
    durationSeconds: bufferedTravelSeconds,
    distanceMeters: Math.round(roadDistanceMiles * MILES_TO_METERS),
    isFallback: true,
    disclaimer: FALLBACK_DISCLAIMER,
  };
}

async function geocodeAddress(address: string, apiKey: string): Promise<LatLng> {
  const response = await fetch(
    `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(address)}&key=${apiKey}`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Geocoding request failed (status ${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    status: string;
    results: Array<{
      geometry: {
        location: { lat: number; lng: number };
      };
    }>;
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(
      `Google Geocoding API error: ${data.status}${
        data.error_message ? ` - ${data.error_message}` : ''
      }`
    );
  }

  const location = data.results[0]?.geometry?.location;
  if (
    !location ||
    typeof location.lat !== 'number' ||
    Number.isNaN(location.lat) ||
    typeof location.lng !== 'number' ||
    Number.isNaN(location.lng)
  ) {
    throw new Error('Geocoding response missing valid coordinates');
  }

  return location;
}

function haversineDistanceMiles(a: LatLng, b: LatLng): number {
  const earthRadiusMiles = 3958.7613;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const haversine =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
