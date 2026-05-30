import { DateTime } from 'luxon'

/**
 * Helper to create consistent test dates.
 * - Luxon uses month 1-12 (unlike JS Date which uses 0-11).
 * - Uses 12:00 UTC to avoid day-transition issues in negative timezones.
 *
 * Usage:
 *   import { testDate } from '@/__tests__/utils/dateUtils'
 *   testDate(2024, 3, 15) // Returns new Date('2024-03-15T12:00:00.000Z')
 */
export const testDate = (year: number, month: number, day: number) =>
  DateTime.fromObject({ year, month, day, hour: 12 }, { zone: 'UTC' }).toJSDate()
