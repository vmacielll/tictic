'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  getActivePomodoro,
  type PomodoroSession,
} from '@/lib/api'

const DEFAULT_DURATION = 25 // minutes

interface PomodoroTimerProps {
  taskId?: string
  onSessionComplete?: () => void
}

export function PomodoroTimer({ taskId, onSessionComplete }: PomodoroTimerProps) {
  const [session, setSession] = useState<PomodoroSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for active session on mount
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const { pomodoroSession } = await getActivePomodoro()
        if (pomodoroSession && pomodoroSession.status === 'RUNNING') {
          setSession(pomodoroSession)
          const elapsed = Date.now() - new Date(pomodoroSession.startedAt).getTime()
          const totalMs = pomodoroSession.duration * 60 * 1000
          const remaining = Math.max(0, totalMs - elapsed)
          setTimeLeft(remaining)
          setIsRunning(true)
        }
      } catch {
        // No active session
      } finally {
        setIsLoading(false)
      }
    }
    checkActiveSession()
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
    if (timeLeft === 0 && session && isRunning === false && session.status === 'RUNNING') {
      handleComplete()
    }
  }, [timeLeft, isRunning, session])

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const newSession = await startPomodoro({
        duration: DEFAULT_DURATION,
        taskId,
      })
      setSession(newSession)
      setTimeLeft(newSession.duration * 60 * 1000)
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to start Pomodoro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!session) return
    setIsLoading(true)
    try {
      const updated = await completePomodoro(session.id)
      setSession(updated)
      setIsRunning(false)
      onSessionComplete?.()
    } catch (error) {
      console.error('Failed to complete Pomodoro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!session) return
    setIsLoading(true)
    try {
      const updated = await cancelPomodoro(session.id)
      setSession(updated)
      setIsRunning(false)
      setTimeLeft(0)
    } catch (error) {
      console.error('Failed to cancel Pomodoro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSession(null)
    setTimeLeft(0)
    setIsRunning(false)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = session ? ((session.duration * 60 * 1000 - timeLeft) / (session.duration * 60 * 1000)) * 100 : 0

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pomodoro Timer</h3>

        {/* Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={session?.status === 'COMPLETED' ? '#22c55e' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {session && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                session.status === 'RUNNING'
                  ? 'bg-red-100 text-red-700'
                  : session.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {session.status === 'RUNNING' ? 'Focusing' : session.status}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!session && (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium"
            >
              Start Focus
            </button>
          )}

          {session?.status === 'RUNNING' && (
            <>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {(session?.status === 'COMPLETED' || session?.status === 'CANCELLED') && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium"
            >
              New Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
