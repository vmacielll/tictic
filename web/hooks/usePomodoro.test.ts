import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePomodoro } from './usePomodoro'

// ── Mock @/lib/api ──
// vi.mock is hoisted to the top, so the factory must use inline vi.fn().
vi.mock('@/lib/api', () => ({
  startPomodoro: vi.fn(),
  completePomodoro: vi.fn(),
  cancelPomodoro: vi.fn(),
  listPomodoros: vi.fn(),
  getActivePomodoro: vi.fn(),
}))

import {
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  listPomodoros,
  getActivePomodoro,
} from '@/lib/api'

// ── Constants ──
const UUID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901'
const TASK_ID = 'c3d4e5f6-a7b8-4012-8def-123456789012'
const DURATION = 25
const BASE_TIME = new Date('2026-04-10T10:00:00.000Z')

// ── Helpers ──
function createRawSession(overrides: Record<string, unknown> = {}) {
  return {
    id: UUID,
    userId: USER_ID,
    taskId: TASK_ID,
    duration: DURATION,
    startedAt: BASE_TIME.toISOString(),
    completedAt: null,
    status: 'RUNNING' as const,
    ...overrides,
  }
}

/** Yields to the microtask queue so pending promise continuations run. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve))
}

// ── Tests ──
describe('usePomodoro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────
  //  Initial load
  // ──────────────────────────────────────────────
  describe('initial load', () => {
    it('loads empty state when no active session exists', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.sessions).toEqual([])
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)
      expect(result.current.error).toBeNull()
      expect(getActivePomodoro).toHaveBeenCalledTimes(1)
      expect(listPomodoros).toHaveBeenCalledTimes(1)
    })

    it('loads running session and starts timer', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      const fiveMinAgo = new Date(BASE_TIME.getTime() - 5 * 60 * 1000)
      const sessionRaw = createRawSession({ startedAt: fiveMinAgo.toISOString() })

      vi.mocked(getActivePomodoro).mockResolvedValue({ pomodoroSession: sessionRaw })
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.activeSession).not.toBeNull()
      expect(result.current.activeSession?.status).toBe('RUNNING')
      expect(result.current.isRunning).toBe(true)
      // 25 min – 5 min = 20 min = 1 200 000 ms
      expect(result.current.timeLeft).toBe(20 * 60 * 1000)
      expect(getActivePomodoro).toHaveBeenCalledTimes(1)
      expect(listPomodoros).toHaveBeenCalledTimes(1)
    })

    it('handles getActivePomodoro error gracefully', async () => {
      vi.mocked(getActivePomodoro).mockRejectedValue(new Error('Network error'))
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)
    })

    it('handles listPomodoros error gracefully', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockRejectedValue(new Error('List error'))

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.sessions).toEqual([])
      expect(result.current.error).toBe('List error')
    })
  })

  // ──────────────────────────────────────────────
  //  startSession
  // ──────────────────────────────────────────────
  describe('startSession', () => {
    it('starts a new pomodoro session', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      expect(startPomodoro).toHaveBeenCalledTimes(1)
      expect(startPomodoro).toHaveBeenCalledWith({
        duration: 25,
        taskId: undefined,
      })
      expect(result.current.activeSession).not.toBeNull()
      expect(result.current.activeSession?.status).toBe('RUNNING')
      expect(result.current.isRunning).toBe(true)
      expect(result.current.timeLeft).toBe(25 * 60 * 1000)
      expect(result.current.loading).toBe(false)
      // Called on mount + after startSession (via loadSessions)
      expect(listPomodoros).toHaveBeenCalledTimes(2)
    })

    it('starts session with custom duration and inherited taskId', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro(TASK_ID))

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession({ duration: 15 }))

      await act(async () => {
        await result.current.startSession(15)
      })

      expect(startPomodoro).toHaveBeenCalledWith({
        duration: 15,
        taskId: TASK_ID,
      })
      expect(result.current.isRunning).toBe(true)
    })

    it('starts session with override taskId', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession(25, TASK_ID)
      })

      expect(startPomodoro).toHaveBeenCalledWith({
        duration: 25,
        taskId: TASK_ID,
      })
    })

    it('handles API error in startSession', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      vi.mocked(startPomodoro).mockRejectedValue(new Error('API error'))

      await act(async () => {
        await expect(result.current.startSession()).rejects.toThrow('API error')
      })

      expect(result.current.error).toBe('API error')
      expect(result.current.activeSession).toBeNull()
      expect(result.current.isRunning).toBe(false)
      expect(result.current.loading).toBe(false)
      expect(startPomodoro).toHaveBeenCalledTimes(1)
    })

    it('handles validation error before API call', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Negative duration should fail zod validation
      await act(async () => {
        await expect(result.current.startSession(-1)).rejects.toThrow()
      })

      expect(startPomodoro).not.toHaveBeenCalled()
      expect(result.current.error).toBeTruthy()
    })
  })

  // ──────────────────────────────────────────────
  //  completeSession
  // ──────────────────────────────────────────────
  describe('completeSession', () => {
    it('completes an active pomodoro session', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      vi.mocked(completePomodoro).mockResolvedValue(
        createRawSession({
          status: 'COMPLETED',
          completedAt: BASE_TIME.toISOString(),
        }),
      )

      await act(async () => {
        await result.current.completeSession()
      })

      expect(completePomodoro).toHaveBeenCalledTimes(1)
      expect(completePomodoro).toHaveBeenCalledWith(UUID)
      expect(result.current.activeSession?.status).toBe('COMPLETED')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)
      expect(result.current.loading).toBe(false)
    })

    it('does nothing when no active session', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.completeSession()
      })

      expect(completePomodoro).not.toHaveBeenCalled()
    })

    it('handles error during completion', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      vi.mocked(completePomodoro).mockRejectedValue(new Error('Complete failed'))

      await act(async () => {
        await result.current.completeSession()
      })

      expect(result.current.error).toBe('Complete failed')
      expect(result.current.loading).toBe(false)
    })
  })

  // ──────────────────────────────────────────────
  //  cancelSession
  // ──────────────────────────────────────────────
  describe('cancelSession', () => {
    it('cancels an active pomodoro session', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      vi.mocked(cancelPomodoro).mockResolvedValue(
        createRawSession({ status: 'CANCELLED' }),
      )

      await act(async () => {
        await result.current.cancelSession()
      })

      expect(cancelPomodoro).toHaveBeenCalledTimes(1)
      expect(cancelPomodoro).toHaveBeenCalledWith(UUID)
      expect(result.current.activeSession?.status).toBe('CANCELLED')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)
      expect(result.current.loading).toBe(false)
    })

    it('does nothing when no active session', async () => {
      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.cancelSession()
      })

      expect(cancelPomodoro).not.toHaveBeenCalled()
    })

    it('handles error during cancellation', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      vi.mocked(cancelPomodoro).mockRejectedValue(new Error('Cancel failed'))

      await act(async () => {
        await result.current.cancelSession()
      })

      expect(result.current.error).toBe('Cancel failed')
      expect(result.current.loading).toBe(false)
    })
  })

  // ──────────────────────────────────────────────
  //  resetSession
  // ──────────────────────────────────────────────
  describe('resetSession', () => {
    it('clears active session locally without API call', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      vi.mocked(startPomodoro).mockResolvedValue(createRawSession())

      await act(async () => {
        await result.current.startSession()
      })

      expect(result.current.activeSession).not.toBeNull()

      act(() => {
        result.current.resetSession()
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)
      expect(completePomodoro).not.toHaveBeenCalled()
      expect(cancelPomodoro).not.toHaveBeenCalled()
    })

    it('is safe to call when no active session', () => {
      const { result } = renderHook(() => usePomodoro())

      act(() => {
        result.current.resetSession()
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.isRunning).toBe(false)
    })
  })

  // ──────────────────────────────────────────────
  //  refreshSessions
  // ──────────────────────────────────────────────
  describe('refreshSessions', () => {
    it('re-fetches both active session and session list', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      vi.mocked(getActivePomodoro).mockResolvedValue({})
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      expect(getActivePomodoro).toHaveBeenCalledTimes(1)
      expect(listPomodoros).toHaveBeenCalledTimes(1)

      // Stub fresh data for the refresh call
      const session = createRawSession()
      vi.mocked(getActivePomodoro).mockResolvedValue({ pomodoroSession: session })
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [session] })

      await act(async () => {
        await result.current.refreshSessions()
      })

      // Flush microtasks for the async refresh flow
      await act(async () => {
        await flushMicrotasks()
      })

      expect(getActivePomodoro).toHaveBeenCalledTimes(2)
      expect(listPomodoros).toHaveBeenCalledTimes(2)
      expect(result.current.activeSession).not.toBeNull()
      expect(result.current.sessions).toHaveLength(1)
    })
  })

  // ──────────────────────────────────────────────
  //  Timer countdown
  // ──────────────────────────────────────────────
  describe('timer countdown', () => {
    it('decrements timeLeft over time when running', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      // Session started 5 minutes ago
      const fiveMinAgo = new Date(BASE_TIME.getTime() - 5 * 60 * 1000)
      const sessionRaw = createRawSession({ startedAt: fiveMinAgo.toISOString() })

      vi.mocked(getActivePomodoro).mockResolvedValue({ pomodoroSession: sessionRaw })
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      // Initial: 20 minutes remaining
      expect(result.current.timeLeft).toBe(20 * 60 * 1000)

      // Advance by 1 second – the interval fires once
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.timeLeft).toBe(20 * 60 * 1000 - 1000)

      // Advance by another 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.timeLeft).toBe(20 * 60 * 1000 - 3000)
    })

    it('pauses countdown when session is stopped', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      const fiveMinAgo = new Date(BASE_TIME.getTime() - 5 * 60 * 1000)
      const sessionRaw = createRawSession({ startedAt: fiveMinAgo.toISOString() })

      vi.mocked(getActivePomodoro).mockResolvedValue({ pomodoroSession: sessionRaw })
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      expect(result.current.isRunning).toBe(true)
      expect(result.current.timeLeft).toBe(20 * 60 * 1000)

      // Advance 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.timeLeft).toBe(20 * 60 * 1000 - 2000)

      // Reset locally (simulates user stopping the session)
      act(() => {
        result.current.resetSession()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeLeft).toBe(0)

      // Advance more time – timer should not change
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.timeLeft).toBe(0)
      expect(result.current.isRunning).toBe(false)
    })

    it('auto-completes session when timer reaches zero', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(BASE_TIME)

      // Session that started 24 minutes 59 seconds ago (1 second remaining)
      const almostExpired = new Date(BASE_TIME.getTime() - (24 * 60 + 59) * 1000)
      const sessionRaw = createRawSession({ startedAt: almostExpired.toISOString() })

      vi.mocked(getActivePomodoro).mockResolvedValue({ pomodoroSession: sessionRaw })
      vi.mocked(listPomodoros).mockResolvedValue({ pomodoroSessions: [] })
      vi.mocked(completePomodoro).mockResolvedValue(
        createRawSession({
          status: 'COMPLETED',
          completedAt: BASE_TIME.toISOString(),
        }),
      )

      const { result } = renderHook(() => usePomodoro())

      await act(async () => {
        await flushMicrotasks()
      })

      expect(result.current.timeLeft).toBe(1000)
      expect(result.current.isRunning).toBe(true)

      // Advance past the 1-second mark – timer fires, expires, triggers auto-complete
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      // Flush microtasks for completeSession continuation + loadSessions
      await act(async () => {
        await flushMicrotasks()
      })
      await act(async () => {
        await flushMicrotasks()
      })

      expect(result.current.timeLeft).toBe(0)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.activeSession?.status).toBe('COMPLETED')
      expect(completePomodoro).toHaveBeenCalledTimes(1)
      expect(completePomodoro).toHaveBeenCalledWith(UUID)
    })
  })
})
