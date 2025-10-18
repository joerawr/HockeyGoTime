/**
 * Travel Calculation Types
 * For Google Maps Routes API integration and travel time calculations
 */

import type { Game } from './schedule';
import type { UserPreferences } from './preferences';

/**
 * Google Routes API v2 Request
 */
export interface ComputeRoutesRequest {
  origin: {
    address: string;
  };
  destination: {
    address: string;
  };
  travelMode: 'DRIVE';
  routingPreference: 'TRAFFIC_AWARE_OPTIMAL';
  departureTime?: string;     // ISO 8601 with timezone (optional, defaults to now)
  trafficModel?: 'BEST_GUESS' | 'PESSIMISTIC' | 'OPTIMISTIC';
  computeAlternativeRoutes: boolean;
  languageCode: 'en-US';
  units: 'IMPERIAL';
}

/**
 * Google Routes API v2 Response
 */
export interface RouteResponse {
  routes: Array<{
    duration: string;        // Duration in seconds with 's' suffix, e.g., "3600s"
    distanceMeters: number;  // Distance in meters, e.g., 45000
    polyline?: {
      encodedPolyline: string; // Encoded polyline for map rendering (optional)
    };
  }>;
}

/**
 * Travel Calculation Result
 * Contains calculated wake-up and departure times for a game
 */
export interface TravelCalculation {
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
  isEstimated?: boolean;            // True when using fallback distance-based estimate
  estimateMethod?: 'distance';      // Indicates estimation strategy used
  disclaimer?: string;              // Message to show users when estimates are used

  // Google Maps Integration
  mapsUrl?: string;                 // Google Maps directions URL with origin and destination pre-populated
}
