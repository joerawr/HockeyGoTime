/**
 * Google Routes API client
 * Handles TRAFFIC_AWARE_OPTIMAL route calculations for travel planning
 */

import { toUTC } from '@/lib/utils/timezone';

import type { ComputeRoutesRequest, RouteResponse } from '@/types/travel';

// Google Routes API endpoint (Directions API v2)
const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Field mask limits the response payload to the data we actually need
const FIELD_MASK =
  'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

interface ComputeRouteParams {
  originAddress: string;
  destinationAddress: string;
  /**
   * Arrival time expressed in the user's local timezone (ISO 8601 string)
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
function buildRequestPayload({
  originAddress,
  destinationAddress,
  arrivalTimeLocalISO,
  timezone,
}: ComputeRouteParams): ComputeRoutesRequest {
  const arrivalUTC = toUTC(arrivalTimeLocalISO, timezone);

  return {
    origin: { address: originAddress },
    destination: { address: destinationAddress },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    arrivalTime: arrivalUTC.toISOString(),
    computeAlternativeRoutes: false,
    languageCode: 'en-US',
    units: 'IMPERIAL',
  };
}

/**
 * Call Google Routes API and return duration/distance for a DRIVE route.
 *
 * @throws Error if the request fails or returns an unexpected shape.
 */
export async function computeRoute(
  params: ComputeRouteParams
): Promise<ComputeRouteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  const requestBody = buildRequestPayload(params);

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

