/**
 * Distance calculator using Google Routes API (Compute Route Matrix)
 * Calculates driving distance in miles without requiring departure times.
 * Works for any game date (past, present, or future).
 *
 * Note: This replaces the deprecated Distance Matrix API as of March 2025.
 * See: https://developers.google.com/maps/documentation/routes/compute_route_matrix
 */

// Google Routes API endpoint (replaces Distance Matrix API)
const ROUTES_API_ENDPOINT =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

const METERS_TO_MILES = 0.000621371;

export interface CalculateDistanceParams {
  originAddress: string;
  destinationAddress: string;
}

export interface DistanceResult {
  distanceMiles: number;
  distanceMeters: number;
  originAddress: string;
  destinationAddress: string;
  mapsUrl: string;
}

/**
 * Calculate driving distance between two addresses using Google Routes API.
 * Does not require departure time - works for any date.
 *
 * @throws Error if the API request fails or returns invalid data
 */
export async function calculateDistance(
  params: CalculateDistanceParams
): Promise<DistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  const { originAddress, destinationAddress } = params;

  // Build request body for Routes API
  const requestBody = {
    origins: [
      {
        waypoint: {
          address: originAddress,
        },
      },
    ],
    destinations: [
      {
        waypoint: {
          address: destinationAddress,
        },
      },
    ],
    travelMode: 'DRIVE',
    // Note: departureTime is optional - when omitted, uses current time
    // This allows the API to work for any date without errors
  };

  const response = await fetch(ROUTES_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,status',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Google Routes API error (status ${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as RouteMatrixResponse;

  // Validate response - Routes API returns an array of route elements
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('Google Routes API returned no route data');
  }

  const routeElement = data[0];
  if (!routeElement) {
    throw new Error('Google Routes API returned invalid route element');
  }

  // Check status
  if (routeElement.status && routeElement.status.code) {
    throw new Error(
      `Google Routes API route error: ${routeElement.status.code}`
    );
  }

  if (typeof routeElement.distanceMeters !== 'number') {
    throw new Error('Google Routes API returned no distance data');
  }

  const distanceMeters = routeElement.distanceMeters;
  const distanceMiles = distanceMeters * METERS_TO_MILES;

  // Generate Google Maps directions URL
  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(originAddress)}` +
    `&destination=${encodeURIComponent(destinationAddress)}` +
    `&travelmode=driving`;

  return {
    distanceMiles,
    distanceMeters,
    originAddress,
    destinationAddress,
    mapsUrl,
  };
}

// Google Routes API (Compute Route Matrix) response types
// Response is an array of route elements
type RouteMatrixResponse = Array<RouteMatrixElement>;

interface RouteMatrixElement {
  originIndex?: number;
  destinationIndex?: number;
  status?: {
    code?: string;
    message?: string;
  };
  distanceMeters?: number;
  duration?: string; // e.g., "558s"
  condition?: string; // e.g., "ROUTE_EXISTS"
}
