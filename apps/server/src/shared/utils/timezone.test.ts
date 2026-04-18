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

describe('isValidTimezone', () => {
  it('should return true for valid timezone', () => {
    expect(isValidTimezone('America/New_York')).toBe(true)
    expect(isValidTimezone('UTC')).toBe(true)
    expect(isValidTimezone('Europe/London')).toBe(true)
  })

  it('should return false for invalid timezone', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false)
    expect(isValidTimezone('NotReal')).toBe(false)
  })

  it('should fallback for invalid timezone', () => {
    const result = getStartOfDayUTC(new Date(), 'Invalid/Timezone')
    const expected = getStartOfDayUTC(new Date(), 'UTC')
    expect(result.getTime()).toBe(expected.getTime())
  })
})

describe('getStartOfDayUTC', () => {
  it('should return start of day in America/New_York', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getStartOfDayUTC(date, 'America/New_York')
    expect(result.getUTCHours()).toBe(4) // 00:00 EST = 05:00 UTC (DST)
  })
})

describe('getEndOfDayUTC', () => {
  it('should return end of day in timezone', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getEndOfDayUTC(date, 'UTC')
    expect(result.getUTCHours()).toBe(23)
    expect(result.getUTCMinutes()).toBe(59)
    expect(result.getUTCSeconds()).toBe(59)
  })
})

describe('getStartOfWeekUTC', () => {
  it('should return Monday start of week', () => {
    const date = new Date('2024-03-15T12:00:00Z') // Friday
    const result = getStartOfWeekUTC(date, 'UTC')
    const expectedDay = result.getUTCDay()
    expect(expectedDay).toBe(1) // Monday
  })
})

describe('getEndOfWeekUTC', () => {
  it('should return Sunday end of week', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getEndOfWeekUTC(date, 'UTC')
    const expectedDay = result.getUTCDay()
    expect(expectedDay).toBe(0) // Sunday
  })
})

describe('formatDateInTimezone', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = formatDateInTimezone(date, 'UTC')
    expect(result).toBe('2024-03-15')
  })
})

describe('formatTimeInTimezone', () => {
  it('should format time as HH:mm', () => {
    const date = new Date('2024-03-15T14:30:00Z')
    const result = formatTimeInTimezone(date, 'UTC')
    expect(result).toBe('14:30')
  })
})

describe('getDayOfWeekInTimezone', () => {
  it('should return correct day of week', () => {
    const friday = new Date('2024-03-15T12:00:00Z') // Friday
    const result = getDayOfWeekInTimezone(friday, 'UTC')
    expect(result).toBe(5) // Friday = 5
  })
})

describe('getYearInTimezone', () => {
  it('should return correct year', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getYearInTimezone(date, 'UTC')
    expect(result).toBe(2024)
  })
})

describe('getMonthInTimezone', () => {
  it('should return correct month', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getMonthInTimezone(date, 'UTC')
    expect(result).toBe(3)
  })
})

describe('getDayInTimezone', () => {
  it('should return correct day of month', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    const result = getDayInTimezone(date, 'UTC')
    expect(result).toBe(15)
  })
})

describe('parseDateToUTC', () => {
  it('should parse date string to UTC', () => {
    const result = parseDateToUTC('2024-03-15', 'UTC')
    expect(result.getUTCFullYear()).toBe(2024)
    expect(result.getUTCMonth()).toBe(2) // March = 2 (0-indexed)
    expect(result.getUTCDate()).toBe(15)
  })

  it('should handle invalid date string', () => {
    expect(() => parseDateToUTC('invalid', 'UTC')).toThrow()
  })
})

describe('DST transitions', () => {
  it('should handle DST switch in America/New_York', () => {
    // March 12, 2023 - DST starts in US
    const date = new Date('2023-03-12T07:00:00Z')
    const start = getStartOfDayUTC(date, 'America/New_York')
    // On DST day, 00:00 local = 05:00 UTC
    expect(start.getUTCHours()).toBe(5)
  })
})

describe('date limits', () => {
  it('should handle epoch start (1970-01-01)', () => {
    const date = new Date(0)
    const result = getStartOfDayUTC(date, 'UTC')
    expect(result.getTime()).toBeGreaterThanOrEqual(0)
  })

  it('should handle far future (2100-12-31)', () => {
    const date = new Date('2100-12-31T12:00:00Z')
    const result = getEndOfDayUTC(date, 'UTC')
    expect(result.getUTCFullYear()).toBe(2100)
  })
})