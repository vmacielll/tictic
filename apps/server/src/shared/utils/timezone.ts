import { DateTime } from 'luxon'

const FALLBACK_TIMEZONE = 'UTC'

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    return DateTime.local().setZone(timezone).isValid
  } catch {
    return false
  }
}

/**
 * Get start of day (00:00:00) in user's timezone, converted to UTC Date
 */
export function getStartOfDayUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  const start = local.startOf('day')
  return start.toUTC().toJSDate()
}

/**
 * Get end of day (23:59:59.999) in user's timezone, converted to UTC Date
 */
export function getEndOfDayUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  const end = local.endOf('day')
  return end.toUTC().toJSDate()
}

/**
 * Get start of week (Monday 00:00:00) in user's timezone, converted to UTC Date
 */
export function getStartOfWeekUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  const start = local.startOf('week') // Monday in ISO 8601
  return start.toUTC().toJSDate()
}

/**
 * Get end of week (Sunday 23:59:59.999) in user's timezone, converted to UTC Date
 */
export function getEndOfWeekUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  const end = local.endOf('week') // Sunday in ISO 8601
  return end.toUTC().toJSDate()
}

/**
 * Format date as YYYY-MM-DD in user's timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  return local.toFormat('yyyy-MM-dd')
}

/**
 * Format time as HH:mm in user's timezone
 */
export function formatTimeInTimezone(date: Date, timezone: string): string {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  return local.toFormat('HH:mm')
}

/**
 * Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday) in user's timezone
 */
export function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  // Luxon: 1=Monday, 7=Sunday
  // Convert to: 0=Sunday, 1=Monday, ..., 6=Saturday
  return local.weekday === 7 ? 0 : local.weekday
}

/**
 * Get year in user's timezone
 */
export function getYearInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  return local.year
}

/**
 * Get month (1-12) in user's timezone
 */
export function getMonthInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  return local.month
}

/**
 * Get day of month (1-31) in user's timezone
 */
export function getDayInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromJSDate(date, { zone: tz })
  return local.day
}

/**
 * Parse a date string (YYYY-MM-DD) as start of day in user's timezone, return UTC Date
 */
export function parseDateToUTC(dateString: string, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  // Parse as local date in the user's timezone
  const local = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: tz })
  return local.toUTC().toJSDate()
}
