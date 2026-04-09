import { describe, it, expect } from 'vitest'
import {
  isValidTimezone,
  getStartOfDayUTC,
  getEndOfDayUTC,
  getStartOfWeekUTC,
  getEndOfWeekUTC,
  formatDateInTimezone,
  formatTimeInTimezone,
  getDayOfWeekInTimezone,
  getYearInTimezone,
  getMonthInTimezone,
  getDayInTimezone,
  parseDateToUTC,
} from './timezone'

describe('timezone utils', () => {
  describe('isValidTimezone', () => {
    it('should return true for valid timezones', () => {
      expect(isValidTimezone('America/Sao_Paulo')).toBe(true)
      expect(isValidTimezone('Asia/Tokyo')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
      expect(isValidTimezone('UTC')).toBe(true)
      expect(isValidTimezone('America/New_York')).toBe(true)
    })

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('')).toBe(false)
      expect(isValidTimezone('ABC123')).toBe(false)
    })
  })

  describe('getStartOfDayUTC', () => {
    it('should return 3am UTC for midnight in Sao Paulo (UTC-3)', () => {
      // April 8, 2026 at noon UTC
      const date = new Date('2026-04-08T12:00:00Z')

      const startOfDay = getStartOfDayUTC(date, 'America/Sao_Paulo')

      // Midnight in Sao Paulo = 3am UTC
      expect(startOfDay.getUTCFullYear()).toBe(2026)
      expect(startOfDay.getUTCMonth()).toBe(3) // April (0-indexed)
      expect(startOfDay.getUTCDate()).toBe(8)
      expect(startOfDay.getUTCHours()).toBe(3)
      expect(startOfDay.getUTCMinutes()).toBe(0)
    })

    it('should return 3pm UTC (previous day) for midnight in Tokyo (UTC+9)', () => {
      // April 8, 2026 at noon UTC
      const date = new Date('2026-04-08T12:00:00Z')

      const startOfDay = getStartOfDayUTC(date, 'Asia/Tokyo')

      // Midnight in Tokyo = 3pm UTC on April 7
      expect(startOfDay.getUTCFullYear()).toBe(2026)
      expect(startOfDay.getUTCMonth()).toBe(3) // April
      expect(startOfDay.getUTCDate()).toBe(7)
      expect(startOfDay.getUTCHours()).toBe(15)
    })

    it('should return midnight UTC for midnight in UTC', () => {
      const date = new Date('2026-04-08T12:00:00Z')

      const startOfDay = getStartOfDayUTC(date, 'UTC')

      expect(startOfDay.getUTCHours()).toBe(0)
      expect(startOfDay.getUTCDate()).toBe(8)
    })

    it('should fallback to UTC for invalid timezone', () => {
      const date = new Date('2026-04-08T12:00:00Z')

      const startOfDay = getStartOfDayUTC(date, 'Invalid/Timezone')

      expect(startOfDay.getUTCHours()).toBe(0)
    })
  })

  describe('getEndOfDayUTC', () => {
    it('should return 2:59:59am UTC (next day) for end of day in Sao Paulo', () => {
      const date = new Date('2026-04-08T12:00:00Z')

      const endOfDay = getEndOfDayUTC(date, 'America/Sao_Paulo')

      // 23:59:59 in Sao Paulo = 2:59:59 UTC on April 9
      expect(endOfDay.getUTCDate()).toBe(9)
      expect(endOfDay.getUTCHours()).toBe(2)
      expect(endOfDay.getUTCMinutes()).toBe(59)
    })
  })

  describe('getStartOfWeekUTC', () => {
    it('should return Monday for a Wednesday date', () => {
      // April 8, 2026 is Wednesday
      const date = new Date('2026-04-08T12:00:00Z')

      const startOfWeek = getStartOfWeekUTC(date, 'America/Sao_Paulo')

      // Monday April 6, 2026 at 3am UTC (midnight in SP)
      expect(startOfWeek.getUTCDate()).toBe(6)
      expect(startOfWeek.getUTCHours()).toBe(3)
    })
  })

  describe('getDayOfWeekInTimezone', () => {
    it('should return 3 (Wednesday) for April 8, 2026 in Sao Paulo', () => {
      const date = new Date('2026-04-08T12:00:00Z')

      const dayOfWeek = getDayOfWeekInTimezone(date, 'America/Sao_Paulo')

      expect(dayOfWeek).toBe(3) // 0=Sun, 1=Mon, 2=Tue, 3=Wed
    })

    it('should return 0 (Sunday) for a Sunday date', () => {
      // April 5, 2026 is Sunday
      const date = new Date('2026-04-05T12:00:00Z')

      const dayOfWeek = getDayOfWeekInTimezone(date, 'America/Sao_Paulo')

      expect(dayOfWeek).toBe(0) // Sunday
    })

    it('should return 1 (Monday) for a Monday date', () => {
      // April 6, 2026 is Monday
      const date = new Date('2026-04-06T12:00:00Z')

      const dayOfWeek = getDayOfWeekInTimezone(date, 'America/Sao_Paulo')

      expect(dayOfWeek).toBe(1) // Monday
    })
  })

  describe('formatDateInTimezone', () => {
    it('should format to previous day when UTC time is before timezone midnight', () => {
      // April 9, 2026 00:00 UTC = April 8, 2026 21:00 in Sao Paulo
      const date = new Date('2026-04-09T00:00:00Z')

      const formatted = formatDateInTimezone(date, 'America/Sao_Paulo')

      expect(formatted).toBe('2026-04-08')
    })

    it('should format correctly for Tokyo timezone', () => {
      // April 8, 2026 20:00 UTC = April 9, 2026 05:00 in Tokyo
      const date = new Date('2026-04-08T20:00:00Z')

      const formatted = formatDateInTimezone(date, 'Asia/Tokyo')

      expect(formatted).toBe('2026-04-09')
    })
  })

  describe('formatTimeInTimezone', () => {
    it('should convert 18:00 UTC to 15:00 in Sao Paulo', () => {
      const date = new Date('2026-04-08T18:00:00Z')

      const time = formatTimeInTimezone(date, 'America/Sao_Paulo')

      expect(time).toBe('15:00')
    })

    it('should convert 18:00 UTC to 03:00 (next day) in Tokyo', () => {
      const date = new Date('2026-04-08T18:00:00Z')

      const time = formatTimeInTimezone(date, 'Asia/Tokyo')

      expect(time).toBe('03:00')
    })
  })

  describe('getYearInTimezone, getMonthInTimezone, getDayInTimezone', () => {
    it('should extract correct date components for Sao Paulo', () => {
      // April 9, 2026 01:00 UTC = April 8, 2026 22:00 in Sao Paulo
      const date = new Date('2026-04-09T01:00:00Z')

      expect(getYearInTimezone(date, 'America/Sao_Paulo')).toBe(2026)
      expect(getMonthInTimezone(date, 'America/Sao_Paulo')).toBe(4) // April
      expect(getDayInTimezone(date, 'America/Sao_Paulo')).toBe(8)
    })
  })

  describe('parseDateToUTC', () => {
    it('should parse date string to UTC for Sao Paulo timezone', () => {
      // April 8, 2026 in Sao Paulo = April 8, 2026 03:00 UTC
      const utcDate = parseDateToUTC('2026-04-08', 'America/Sao_Paulo')

      expect(utcDate.getUTCFullYear()).toBe(2026)
      expect(utcDate.getUTCMonth()).toBe(3) // April
      expect(utcDate.getUTCDate()).toBe(8)
      expect(utcDate.getUTCHours()).toBe(3)
    })

    it('should parse date string to UTC for Tokyo timezone', () => {
      // April 8, 2026 in Tokyo = April 7, 2026 15:00 UTC
      const utcDate = parseDateToUTC('2026-04-08', 'Asia/Tokyo')

      expect(utcDate.getUTCFullYear()).toBe(2026)
      expect(utcDate.getUTCMonth()).toBe(3) // April
      expect(utcDate.getUTCDate()).toBe(7)
      expect(utcDate.getUTCHours()).toBe(15)
    })
  })

  describe('edge cases', () => {
    it('should handle daylight saving time transitions', () => {
      // Test with a date that might be during DST transition
      const date = new Date('2026-01-15T12:00:00Z') // January (no DST in Brazil)

      const startOfDay = getStartOfDayUTC(date, 'America/Sao_Paulo')

      // Should still work correctly
      expect(startOfDay.getUTCHours()).toBe(3)
    })

    it('should handle dates near midnight correctly', () => {
      // Just before midnight in Sao Paulo
      const date = new Date('2026-04-09T02:59:00Z') // April 8, 23:59 SP time

      const formatted = formatDateInTimezone(date, 'America/Sao_Paulo')

      expect(formatted).toBe('2026-04-08')
    })
  })
})
