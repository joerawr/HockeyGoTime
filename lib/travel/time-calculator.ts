/**
 * Travel time calculator
 * Combines Google Routes API data with user preferences to compute wake-up and departure times.
 */

import { computeRoute } from '@/lib/travel/google-routes';
import { parseDSTAware } from '@/lib/utils/timezone';

import type { Game } from '@/types/schedule';
import type { TravelCalculation } from '@/types/travel';
import type { UserPreferences } from '@/types/preferences';

interface CalculateTravelTimesOptions {
  /**
   * Resolved venue address (hardcoded mappings for Capstone scope)
   */
  venueAddress: string;
  /**
   * Optional override for timezone (defaults to Game.timezone or America/Los_Angeles)
   */
  timezone?: string;
}

const DEFAULT_TIMEZONE = 'America/Los_Angeles';

// Map common timezone abbreviations to IANA timezone identifiers
const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  'PT': 'America/Los_Angeles',
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'MT': 'America/Denver',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'CT': 'America/Chicago',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'ET': 'America/New_York',
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'UTC': 'UTC',
  'GMT': 'UTC',
};

function normalizeTimezone(value?: string | null): string {
  const candidate = (value ?? '').trim();
  if (!candidate) {
    return DEFAULT_TIMEZONE;
  }

  // Check if it's a known abbreviation
  const mapped = TIMEZONE_ABBREVIATIONS[candidate.toUpperCase()];
  if (mapped) {
    return mapped;
  }

  // Try to use it directly as an IANA timezone
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    console.warn(
      `[travel] Unsupported timezone '${candidate}', falling back to ${DEFAULT_TIMEZONE}`
    );
    return DEFAULT_TIMEZONE;
  }
}

function formatISO(date: Date, timezone: string): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error(`[travel] Cannot format invalid date for timezone ${timezone}`);
  }

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    calendar: 'iso8601',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dateFormatter.formatToParts(date);
  const find = (type: string) => parts.find((part) => part.type === type)?.value;

  const year = find('year');
  const month = find('month');
  const day = find('day');
  const hour = find('hour');
  const minute = find('minute');
  const second = find('second');

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error(`Unable to format date for timezone ${timezone}`);
  }

  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });

  const offsetParts = offsetFormatter.formatToParts(date);
  const offsetValue = offsetParts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';

  let offset = '+00:00';
  const match = offsetValue.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (match) {
    const hoursWithSign = match[1];
    const minutes = (match[2] ?? '00').padStart(2, '0');
    const sign = hoursWithSign.startsWith('-') ? '-' : '+';
    const hourDigits = hoursWithSign.replace(/^[+-]/, '').padStart(2, '0');
    offset = `${sign}${hourDigits}:${minutes}`;
  } else if (/UTC/i.test(offsetValue)) {
    offset = '+00:00';
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

/**
 * Calculate wake-up and departure times for a given game and user preferences.
 *
 * @param game Game metadata from schedule
 * @param userPreferences Current user's saved preferences
 * @param options Additional calculation options (resolved venue address, timezone override)
 */
export async function calculateTravelTimes(
  game: Game,
  userPreferences: UserPreferences,
  options: CalculateTravelTimesOptions
): Promise<TravelCalculation> {
  const timezone = normalizeTimezone(options.timezone ?? game.timezone);

  if (!userPreferences.homeAddress) {
    throw new Error('User preferences must include a home address to calculate travel times');
  }

  if (!options.venueAddress) {
    throw new Error('calculateTravelTimes requires a resolved venue address');
  }

  // Combine game date/time into a Date that respects DST
  const gameDateTime = parseDSTAware(game.date, game.time, timezone);

  // Calculate arrival and departure times based on user buffers
  const arrivalTime = new Date(
    gameDateTime.getTime() - userPreferences.arrivalBufferMinutes * 60 * 1000
  );

  // Fetch travel duration from Google Routes API
  const route = await computeRoute({
    originAddress: userPreferences.homeAddress,
    destinationAddress: options.venueAddress,
    arrivalTimeLocalISO: formatISO(gameDateTime, timezone),
    timezone,
  });

  // Use the HIGH end of Google's estimated range (pessimistic) for leave-by calculations
  // while still exposing the full range in the returned result.
  const effectiveDurationSeconds =
    route.durationRangeSeconds?.high ?? route.durationSeconds;

  const departureTime = new Date(
    arrivalTime.getTime() - effectiveDurationSeconds * 1000
  );
  const wakeUpTime = new Date(
    departureTime.getTime() - userPreferences.prepTimeMinutes * 60 * 1000
  );

  // Generate Google Maps directions URL
  const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(userPreferences.homeAddress)}` +
    `&destination=${encodeURIComponent(options.venueAddress)}` +
    `&travelmode=driving`;

  return {
    game,
    userPreferences,
    venueAddress: options.venueAddress,
    travelDurationSeconds: effectiveDurationSeconds,
    travelDurationLowSeconds: route.durationRangeSeconds?.low,
    travelDurationHighSeconds: route.durationRangeSeconds?.high,
    distanceMeters: route.distanceMeters,
    gameTime: formatISO(gameDateTime, timezone),
    arrivalTime: formatISO(arrivalTime, timezone),
    departureTime: formatISO(departureTime, timezone),
    wakeUpTime: formatISO(wakeUpTime, timezone),
    calculatedAt: new Date().toISOString(),
    isEstimated: route.isFallback ?? false,
    estimateMethod: route.isFallback ? 'distance' : undefined,
    disclaimer: route.disclaimer,
    mapsUrl,
  };
}
