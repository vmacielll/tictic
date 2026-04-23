import { DateTime } from 'luxon'

const FALLBACK_TIMEZONE = 'UTC'

const withZone = (date: Date, tz: string): DateTime => DateTime.fromJSDate(date, { zone: tz })

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  return DateTime.local().setZone(timezone).isValid
}

/**
 * Get start of day (00:00:00) in user's timezone, converted to UTC Date
 */
export function getStartOfDayUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).startOf('day').toUTC().toJSDate()
}

/**
 * Get end of day (23:59:59.999) in user's timezone, converted to UTC Date
 */
export function getEndOfDayUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).endOf('day').toUTC().toJSDate()
}

/**
 * Get start of week (Monday 00:00:00) in user's timezone, converted to UTC Date
 */
export function getStartOfWeekUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).startOf('week').toUTC().toJSDate()
}

/**
 * Get end of week (Sunday 23:59:59.999) in user's timezone, converted to UTC Date
 */
export function getEndOfWeekUTC(date: Date, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).endOf('week').toUTC().toJSDate()
}

/**
 * Format date as YYYY-MM-DD in user's timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).toFormat('yyyy-MM-dd')
}

/**
 * Format time as HH:mm in user's timezone
 */
export function formatTimeInTimezone(date: Date, timezone: string): string {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).toFormat('HH:mm')
}

/**
 * Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday) in user's timezone
 */
export function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = withZone(date, tz)
  // Luxon: 1=Monday, 7=Sunday
  // Convert to: 0=Sunday, 1=Monday, ..., 6=Saturday
  return local.weekday === 7 ? 0 : local.weekday
}

/**
 * Get year in user's timezone
 */
export function getYearInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).year
}

/**
 * Get month (1-12) in user's timezone
 */
export function getMonthInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).month
}

/**
 * Get day of month (1-31) in user's timezone
 */
export function getDayInTimezone(date: Date, timezone: string): number {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  return withZone(date, tz).day
}

/**
 * Parse a date string (YYYY-MM-DD) as start of day in user's timezone, return UTC Date
 */
export function parseDateToUTC(dateString: string, timezone: string): Date {
  const tz = isValidTimezone(timezone) ? timezone : FALLBACK_TIMEZONE
  const local = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: tz })
  if (!local.isValid) {
    throw new Error(`Invalid date format: ${dateString}`)
  }
  return local.toUTC().toJSDate()
}
