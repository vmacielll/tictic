'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

  const [activeSession, setActiveSession] = useState<PomodoroSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Data fetching via React Query ──
  const activeQuery = useQuery({
    queryKey: ['pomodoro', 'active'],
    queryFn: async ({ signal }) => {
      const raw = await getActivePomodoro(signal)
      return parseActivePomodoro(raw)
    },
    staleTime: 0,
  })

  const sessionsQuery = useQuery({
    queryKey: ['pomodoro', 'sessions'],
    queryFn: async ({ signal }) => {
      const raw = await listPomodoros(signal)
      return parsePomodoroList(raw)
    },
  })

  // Sync React Query data → timer state on mount and when activeData changes
  useEffect(() => {
    if (activeQuery.data && activeQuery.data.status === 'RUNNING') {
      setActiveSession(activeQuery.data)
      setStartedAt(activeQuery.data.startedAt.getTime())
      setTimeLeft(getTimeLeft(activeQuery.data))
      setIsRunning(true)
    } else if (activeQuery.data !== undefined) {
      setActiveSession(null)
      setStartedAt(null)
      setTimeLeft(0)
      setIsRunning(false)
    }
  }, [activeQuery.data])

  // ── Mutations ──

  const startMutation = useMutation({
    mutationFn: async ({ duration, taskIdOverride }: { duration: number; taskIdOverride?: string }) => {
      const input: StartPomodoroInput = {
        duration,
        taskId: taskIdOverride ?? taskId,
      }
      const validated = startPomodoroSchema.parse(input)
      const raw = await startPomodoro(validated)
      return parsePomodoro(raw)
    },
    onSuccess: (session) => {
      setActiveSession(session)
      setStartedAt(Date.now())
      setTimeLeft(session.duration * 60 * 1000)
      setIsRunning(true)
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'sessions'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to start Pomodoro')
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session')
      const raw = await completePomodoro(activeSession.id)
      return parsePomodoro(raw)
    },
    onSuccess: (session) => {
      setActiveSession(session)
      setIsRunning(false)
      setTimeLeft(0)
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'sessions'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to complete Pomodoro')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session')
      const raw = await cancelPomodoro(activeSession.id)
      return parsePomodoro(raw)
    },
    onSuccess: (session) => {
      setActiveSession(session)
      setIsRunning(false)
      setTimeLeft(0)
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'sessions'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to cancel Pomodoro')
    },
  })

  // ── Timer countdown — uses startedAt for accurate calculation (no drift) ──
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

  // ── Auto-complete when timer reaches 0 ──
  useEffect(() => {
    if (timeLeft === 0 && activeSession && !isRunning && activeSession.status === 'RUNNING') {
      completeMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning, activeSession])

  // ── Public interface ──

  const startSession = useCallback(async (duration: number = DEFAULT_DURATION, taskIdOverride?: string) => {
    setError(null)
    await startMutation.mutateAsync({ duration, taskIdOverride })
  }, [startMutation])

  const completeSession = useCallback(async () => {
    if (!activeSession) return
    setError(null)
    try {
      await completeMutation.mutateAsync()
    } catch {
      // Error is already handled by onError – match original behavior of swallowing
    }
  }, [activeSession, completeMutation])

  const cancelSession = useCallback(async () => {
    if (!activeSession) return
    setError(null)
    try {
      await cancelMutation.mutateAsync()
    } catch {
      // Error is already handled by onError – match original behavior of swallowing
    }
  }, [activeSession, cancelMutation])

  const resetSession = useCallback(() => {
    setActiveSession(null)
    setTimeLeft(0)
    setIsRunning(false)
  }, [])

  const refreshSessions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] })
    await queryClient.invalidateQueries({ queryKey: ['pomodoro', 'sessions'] })
  }, [queryClient])

  const loading =
    activeQuery.isLoading ||
    sessionsQuery.isLoading ||
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending

  const sessions = sessionsQuery.data ?? []

  const combinedError =
    error ??
    (activeQuery.error instanceof Error ? activeQuery.error.message : null) ??
    (sessionsQuery.error instanceof Error ? sessionsQuery.error.message : null) ??
    null

  return {
    activeSession,
    sessions,
    timeLeft,
    isRunning,
    loading,
    error: combinedError,
    startSession,
    completeSession,
    cancelSession,
    resetSession,
    refreshSessions,
  }
}
