'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  listPomodoros,
  getActivePomodoro,
} from '@/lib/api'
import {
  type PomodoroSession,
  type StartPomodoroInput,
  parsePomodoro,
  parsePomodoroList,
  parseActivePomodoro,
  startPomodoroSchema,
  getTimeLeft,
} from '@/domain/pomodoro/types'

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
  const [startedAt, setStartedAt] = useState<number | null>(null)

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

  // Timer countdown - uses startedAt for accurate calculation (no drift)
  useEffect(() => {
    if (!isRunning || !startedAt || !activeSession) return

    const updateTimer = () => {
      const totalMs = activeSession.duration * 60 * 1000
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, totalMs - elapsed)
      
      if (remaining <= 0) {
        setIsRunning(false)
        setTimeLeft(0)
      } else {
        setTimeLeft(remaining)
      }
    }

    // Update immediately
    updateTimer()
    
    // Then update every second
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isRunning, startedAt, activeSession])

  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && activeSession && !isRunning && activeSession.status === 'RUNNING') {
      completeSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning, activeSession])

  const loadActiveSession = useCallback(async () => {
    try {
      const raw = await getActivePomodoro()
      const session = parseActivePomodoro(raw)
      if (session && session.status === 'RUNNING') {
        setActiveSession(session)
        setStartedAt(session.startedAt.getTime())
        const remaining = getTimeLeft(session)
        setTimeLeft(remaining)
        setIsRunning(true)
      } else {
        setActiveSession(null)
        setStartedAt(null)
        setTimeLeft(0)
        setIsRunning(false)
      }
    } catch {
      setActiveSession(null)
      setStartedAt(null)
      setTimeLeft(0)
      setIsRunning(false)
    }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const raw = await listPomodoros()
      setSessions(parsePomodoroList(raw))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    }
  }, [])

  const startSession = useCallback(async (duration: number = DEFAULT_DURATION, taskIdOverride?: string) => {
    setLoading(true)
    setError(null)
    try {
      const input: StartPomodoroInput = {
        duration,
        taskId: taskIdOverride ?? taskId,
      }
      const validated = startPomodoroSchema.parse(input)
      const raw = await startPomodoro(validated)
      const newSession = parsePomodoro(raw)
      setActiveSession(newSession)
      setStartedAt(Date.now())
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
      const raw = await completePomodoro(activeSession.id)
      const updated = parsePomodoro(raw)
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
      const raw = await cancelPomodoro(activeSession.id)
      const updated = parsePomodoro(raw)
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
