'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  listPomodoros,
  getActivePomodoro,
  type PomodoroSession,
} from '@/lib/api'

interface UsePomodoroReturn {
  activeSession: PomodoroSession | null
  sessions: PomodoroSession[]
  timeLeft: number
  isRunning: boolean
  loading: boolean
  error: string | null
  startSession: (duration?: number, taskId?: string) => Promise<void>
  completeSession: () => Promise<void>
  cancelSession: () => Promise<void>
  resetSession: () => void
  refreshSessions: () => Promise<void>
}

const DEFAULT_DURATION = 25 // minutes

export function usePomodoro(taskId?: string): UsePomodoroReturn {
  const [activeSession, setActiveSession] = useState<PomodoroSession | null>(null)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sessions on mount
  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadActiveSession(), loadSessions()])
      } catch {
        // Error handled in individual functions
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          setIsRunning(false)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && activeSession && !isRunning && activeSession.status === 'RUNNING') {
      completeSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning, activeSession])

  const loadActiveSession = useCallback(async () => {
    try {
      const { pomodoroSession } = await getActivePomodoro()
      if (pomodoroSession && pomodoroSession.status === 'RUNNING') {
        setActiveSession(pomodoroSession)
        const elapsed = Date.now() - new Date(pomodoroSession.startedAt).getTime()
        const totalMs = pomodoroSession.duration * 60 * 1000
        const remaining = Math.max(0, totalMs - elapsed)
        setTimeLeft(remaining)
        setIsRunning(true)
      } else {
        setActiveSession(null)
        setTimeLeft(0)
        setIsRunning(false)
      }
    } catch {
      setActiveSession(null)
      setTimeLeft(0)
      setIsRunning(false)
    }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const { pomodoroSessions } = await listPomodoros()
      setSessions(pomodoroSessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    }
  }, [])

  const startSession = useCallback(async (duration: number = DEFAULT_DURATION, taskIdOverride?: string) => {
    setLoading(true)
    setError(null)
    try {
      const newSession = await startPomodoro({
        duration,
        taskId: taskIdOverride ?? taskId,
      })
      setActiveSession(newSession)
      setTimeLeft(newSession.duration * 60 * 1000)
      setIsRunning(true)
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Pomodoro')
      throw err
    } finally {
      setLoading(false)
    }
  }, [taskId, loadSessions])

  const completeSession = useCallback(async () => {
    if (!activeSession) return
    setLoading(true)
    setError(null)
    try {
      const updated = await completePomodoro(activeSession.id)
      setActiveSession(updated)
      setIsRunning(false)
      setTimeLeft(0)
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete Pomodoro')
    } finally {
      setLoading(false)
    }
  }, [activeSession, loadSessions])

  const cancelSession = useCallback(async () => {
    if (!activeSession) return
    setLoading(true)
    setError(null)
    try {
      const updated = await cancelPomodoro(activeSession.id)
      setActiveSession(updated)
      setIsRunning(false)
      setTimeLeft(0)
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel Pomodoro')
    } finally {
      setLoading(false)
    }
  }, [activeSession, loadSessions])

  const resetSession = useCallback(() => {
    setActiveSession(null)
    setTimeLeft(0)
    setIsRunning(false)
  }, [])

  const refreshSessions = useCallback(async () => {
    await Promise.all([loadActiveSession(), loadSessions()])
  }, [loadActiveSession, loadSessions])

  return {
    activeSession,
    sessions,
    timeLeft,
    isRunning,
    loading,
    error,
    startSession,
    completeSession,
    cancelSession,
    resetSession,
    refreshSessions,
  }
}
