import { describe, it, expect } from 'vitest'
import {
  parseCalendarDays,
  parseCalendarDayDetail,
  getTaskCountForDate,
} from './types'

const validCalendarDay = {
  date: '2026-04-10',
  tasks: [
    {
      id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
      title: 'Task 1',
      priority: 'HIGH' as const,
      completed: false,
      dueDate: '2026-04-10',
    },
    {
      id: 'b2c3d4e5-f6a7-4901-bcde-f12345678901',
      title: 'Task 2',
      priority: 'LOW' as const,
      completed: true,
      dueDate: '2026-04-10',
    },
  ],
}

const validCalendarDayDetail = {
  date: '2026-04-10',
  tasks: [
    {
      id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
      title: 'Task 1',
      description: 'Detailed description',
      priority: 'HIGH' as const,
      completed: false,
      dueDate: '2026-04-10',
      dueTime: '14:00',
      listId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
    },
  ],
}

describe('parseCalendarDays', () => {
  it('parses an array of calendar days with summary tasks', () => {
    const days = parseCalendarDays([validCalendarDay])

    expect(days).toHaveLength(1)
    expect(days[0].date).toBe('2026-04-10')
    expect(days[0].tasks).toHaveLength(2)
    expect(days[0].tasks[0].dueDate).toBeInstanceOf(Date)
    // Summary tasks don't have description, dueTime, listId
    expect('description' in days[0].tasks[0]).toBe(false)
  })

  it('throws on invalid task structure', () => {
    const raw = [{
      date: '2026-04-10',
      tasks: [{ id: 'not-a-uuid', title: 'Task' }],
    }]
    expect(() => parseCalendarDays(raw)).toThrow()
  })
})

describe('parseCalendarDayDetail', () => {
  it('parses a detailed calendar day', () => {
    const detail = parseCalendarDayDetail(validCalendarDayDetail)

    expect(detail.date).toBe('2026-04-10')
    expect(detail.tasks).toHaveLength(1)
    expect(detail.tasks[0].dueDate).toBeInstanceOf(Date)
    expect(detail.tasks[0].dueTime).toBe('14:00')
    expect(detail.tasks[0].description).toBe('Detailed description')
    expect(detail.tasks[0].listId).toBe('c3d4e5f6-a7b8-4012-8def-123456789012')
  })

  it('handles optional fields as undefined', () => {
    const raw = {
      date: '2026-04-10',
      tasks: [{
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Simple task',
        priority: 'MEDIUM' as const,
        completed: false,
        dueDate: '2026-04-10',
      }],
    }
    const detail = parseCalendarDayDetail(raw)

    expect(detail.tasks[0].description).toBeUndefined()
    expect(detail.tasks[0].dueTime).toBeUndefined()
    expect(detail.tasks[0].listId).toBeUndefined()
  })
})

describe('getTaskCountForDate', () => {
  it('returns task count for matching date', () => {
    const days = parseCalendarDays([validCalendarDay])
    const count = getTaskCountForDate(days, new Date('2026-04-10'))
    expect(count).toBe(2)
  })

  it('returns 0 for date with no tasks', () => {
    const days = parseCalendarDays([validCalendarDay])
    const count = getTaskCountForDate(days, new Date('2026-04-11'))
    expect(count).toBe(0)
  })
})
