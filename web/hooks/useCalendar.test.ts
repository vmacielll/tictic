import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCalendar } from './useCalendar'

// ── Mock @/lib/api ──
vi.mock('@/lib/api', () => ({
  getCalendarMonth: vi.fn(),
  getCalendarWeek: vi.fn(),
  getCalendarDay: vi.fn(),
  updateTask: vi.fn(),
}))

import {
  getCalendarMonth,
  getCalendarWeek,
  getCalendarDay,
  updateTask,
} from '@/lib/api'

// ── Mock data ──
// Must pass through calendarDaySchema / calendarDayDetailSchema Zod parsers.
// - date fields must be YYYY-MM-DD strings (z.string().date())
// - id fields must be valid UUIDs
// - dueDate will be transformed to Date by Zod transforms

const MOCK_TASK_ID_1 = 'd1a2b3c4-0001-4000-8000-000000000001'
const MOCK_TASK_ID_2 = 'd1a2b3c4-0001-4000-8000-000000000002'

const mockDaysData = [
  {
    date: '2026-05-01',
    tasks: [
      {
        id: MOCK_TASK_ID_1,
        title: 'Task 1',
        priority: 'MEDIUM' as const,
        completed: false,
        dueDate: '2026-05-01',
      },
    ],
  },
  {
    date: '2026-05-02',
    tasks: [],
  },
]

const mockDayDetail = {
  date: '2026-05-15',
  tasks: [
    {
      id: MOCK_TASK_ID_2,
      title: 'Day Task',
      description: 'A detailed task',
      priority: 'HIGH' as const,
      completed: false,
      dueDate: '2026-05-15',
      dueTime: '14:00',
    },
  ],
}

describe('useCalendar', () => {
  beforeEach(() => {
    // Only fake Date so waitFor (which uses setTimeout) still works
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 4, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── 1. Initial fetch (month view) ──
  it('fetches month data on mount with default initialView', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar())

    expect(result.current.loading).toBe(true)
    expect(result.current.days).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarMonth).toHaveBeenCalledWith(5, 2026, expect.any(AbortSignal))
    expect(result.current.view).toBe('month')
    expect(result.current.days).toHaveLength(2)
    expect(result.current.days[0].tasks[0].title).toBe('Task 1')
    expect(result.current.singleDay).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ── 2. Initial fetch (week view) ──
  it('fetches week data on mount when initialView is week', async () => {
    vi.mocked(getCalendarWeek).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar('week'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarWeek).toHaveBeenCalledWith('2026-05-15', expect.any(AbortSignal))
    expect(result.current.view).toBe('week')
    expect(result.current.days).toHaveLength(2)
    expect(result.current.singleDay).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ── 3. Initial fetch (day view) ──
  it('fetches day data on mount when initialView is day', async () => {
    vi.mocked(getCalendarDay).mockResolvedValue(mockDayDetail)

    const { result } = renderHook(() => useCalendar('day'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarDay).toHaveBeenCalledWith('2026-05-15', expect.any(AbortSignal))
    expect(result.current.view).toBe('day')
    expect(result.current.singleDay).not.toBeNull()
    expect(result.current.singleDay?.tasks[0].title).toBe('Day Task')
    expect(result.current.days).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  // ── 4. goToNext ──
  it('goToNext advances the date and re-fetches (month view)', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarMonth).toHaveBeenCalledTimes(1)
    expect(getCalendarMonth).toHaveBeenCalledWith(5, 2026, expect.any(AbortSignal))

    await act(async () => {
      result.current.goToNext()
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarMonth).toHaveBeenCalledTimes(2)
    expect(getCalendarMonth).toHaveBeenNthCalledWith(2, 6, 2026, expect.any(AbortSignal))
  })

  // ── 5. goToPrev ──
  it('goToPrev goes back and re-fetches (month view)', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      result.current.goToPrev()
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarMonth).toHaveBeenCalledTimes(2)
    expect(getCalendarMonth).toHaveBeenNthCalledWith(2, 4, 2026, expect.any(AbortSignal))
  })

  // ── 6. goToToday ──
  it('goToToday resets currentDate to today and re-fetches', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Navigate away from today to a different month
    await act(async () => {
      result.current.goToNext()
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(getCalendarMonth).toHaveBeenNthCalledWith(2, 6, 2026, expect.any(AbortSignal))

    // Reset back to today
    await act(async () => {
      result.current.goToToday()
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getCalendarMonth).toHaveBeenCalledTimes(3)
    expect(getCalendarMonth).toHaveBeenNthCalledWith(3, 5, 2026, expect.any(AbortSignal))
    expect(result.current.currentDate.getFullYear()).toBe(2026)
    expect(result.current.currentDate.getMonth()).toBe(4) // May = 4 (0-indexed)
    expect(result.current.currentDate.getDate()).toBe(15)
  })

  // ── 7. goToDay ──
  it('goToDay switches to day view with the given date', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })
    vi.mocked(getCalendarDay).mockResolvedValue(mockDayDetail)

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const targetDate = new Date(2026, 6, 20) // July 20, 2026
    await act(async () => {
      result.current.goToDay(targetDate)
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.view).toBe('day')
    expect(getCalendarDay).toHaveBeenCalledWith('2026-07-20', expect.any(AbortSignal))
    expect(result.current.singleDay).not.toBeNull()
    expect(result.current.days).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  // ── 8. setView ──
  it('setView changes the view type and re-fetches', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })
    vi.mocked(getCalendarWeek).mockResolvedValue({ days: mockDaysData })

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(getCalendarMonth).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.setView('week')
    })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.view).toBe('week')
    expect(getCalendarWeek).toHaveBeenCalledWith('2026-05-15', expect.any(AbortSignal))
    expect(result.current.days).toHaveLength(2)
    expect(result.current.singleDay).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ── 9. onToggleTask ──
  it('onToggleTask calls updateTask then re-fetches', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })
    vi.mocked(updateTask).mockResolvedValue({})

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(getCalendarMonth).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.onToggleTask(MOCK_TASK_ID_1, false)
    })

    expect(updateTask).toHaveBeenCalledWith(MOCK_TASK_ID_1, { completed: true })
    // Should have re-fetched after the update
    expect(getCalendarMonth).toHaveBeenCalledTimes(2)
    expect(result.current.error).toBeNull()
  })

  // ── 10. onToggleTask error ──
  it('onToggleTask sets error on API failure', async () => {
    vi.mocked(getCalendarMonth).mockResolvedValue({ days: mockDaysData })
    vi.mocked(updateTask).mockRejectedValue(new Error('Failed to update'))

    const { result } = renderHook(() => useCalendar())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(
        result.current.onToggleTask(MOCK_TASK_ID_1, false),
      ).rejects.toThrow('Failed to update')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to update')
    })
  })

  // ── 11. API fetch error ──
  it('sets error message when initial fetch fails', async () => {
    vi.mocked(getCalendarMonth).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.days).toHaveLength(0)
    expect(result.current.singleDay).toBeNull()
  })
})
