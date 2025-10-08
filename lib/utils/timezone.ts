/**
 * Timezone Utility Functions
 * Handles PST/PDT <-> UTC conversions for Google Routes API and user display
 */

import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// California timezone (handles PST/PDT automatically)
const CALIFORNIA_TZ = 'America/Los_Angeles';

/**
 * Convert California local time to UTC
 * Handles DST transitions automatically
 *
 * @param localTime Local time string (e.g., "2025-10-05T07:00:00")
 * @param timezone IANA timezone (default: America/Los_Angeles)
 * @returns UTC Date object
 *
 * @example
 * toUTC("2025-10-05T07:00:00", "America/Los_Angeles")
 * // Returns Date object in UTC (2025-10-05T14:00:00Z in PDT, 15:00:00Z in PST)
 */
export function toUTC(localTime: string, timezone: string = CALIFORNIA_TZ): Date {
  // Parse the local time and convert to UTC
  const localDate = parseISO(localTime);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert UTC to California local time
 * Handles DST transitions automatically
 *
 * @param utcTime UTC Date object
 * @param timezone IANA timezone (default: America/Los_Angeles)
 * @returns Local Date object
 *
 * @example
 * fromUTC(new Date("2025-10-05T14:00:00Z"), "America/Los_Angeles")
 * // Returns Date in PT (7:00 AM PDT or 6:00 AM PST depending on DST)
 */
export function fromUTC(utcTime: Date, timezone: string = CALIFORNIA_TZ): Date {
  return toZonedTime(utcTime, timezone);
}

/**
 * Format date in 12-hour AM/PM format with timezone indicator
 * User-friendly display format per constitution requirement
 *
 * @param date Date object to format
 * @param timezone IANA timezone (default: America/Los_Angeles)
 * @returns Formatted time string (e.g., "7:00 AM PST" or "7:00 AM PDT")
 *
 * @example
 * format12Hour(new Date("2025-10-05T07:00:00-07:00"))
 * // Returns "7:00 AM PDT"
 */
export function format12Hour(date: Date, timezone: string = CALIFORNIA_TZ): string {
  // Format time in 12-hour format
  const time = formatInTimeZone(date, timezone, 'h:mm a');

  // Get timezone abbreviation (PST or PDT)
  const tzAbbr = formatInTimeZone(date, timezone, 'zzz');

  return `${time} ${tzAbbr}`;
}

/**
 * Parse date and time strings with DST awareness
 * Combines separate date and time strings into a single Date object
 *
 * @param date Date string (ISO 8601, e.g., "2025-10-05")
 * @param time Time string (24-hour, e.g., "07:00")
 * @param timezone IANA timezone (default: America/Los_Angeles)
 * @returns Date object in local timezone
 *
 * @example
 * parseDSTAware("2025-10-05", "07:00")
 * // Returns Date object for 7:00 AM PT on Oct 5, 2025
 */
export function parseDSTAware(
  date: string,
  time: string,
  timezone: string = CALIFORNIA_TZ
): Date {
  // Combine date and time
  const dateTimeStr = `${date}T${time}:00`;
  const localDate = parseISO(dateTimeStr);

  // Interpret as local time in specified timezone
  return toZonedTime(localDate, timezone);
}

/**
 * Format full date and time for user display
 * Includes day of week, date, and 12-hour time
 *
 * @param date Date object
 * @param timezone IANA timezone (default: America/Los_Angeles)
 * @returns Formatted string (e.g., "Sunday, October 5th at 7:00 AM PDT")
 *
 * @example
 * formatFullDateTime(new Date("2025-10-05T07:00:00-07:00"))
 * // Returns "Sunday, October 5th at 7:00 AM PDT"
 */
export function formatFullDateTime(date: Date, timezone: string = CALIFORNIA_TZ): string {
  const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');
  const monthDay = formatInTimeZone(date, timezone, 'MMMM do');
  const time = format12Hour(date, timezone);

  return `${dayOfWeek}, ${monthDay} at ${time}`;
}

/**
 * Get current date/time in California timezone
 * Useful for "now" comparisons and relative queries
 *
 * @returns Current Date object in California timezone
 */
export function getNowInCalifornia(): Date {
  return toZonedTime(new Date(), CALIFORNIA_TZ);
}
