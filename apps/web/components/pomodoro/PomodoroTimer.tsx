'use client'

import { usePomodoro } from '@/hooks/usePomodoro'

interface PomodoroTimerProps {
  taskId?: string
  onSessionComplete?: () => void
}

export function PomodoroTimer({ taskId, onSessionComplete }: PomodoroTimerProps) {
  const {
    activeSession: session,
    timeLeft,
    isRunning,
    loading,
    error,
    startSession,
    completeSession,
    cancelSession,
    resetSession,
  } = usePomodoro(taskId)

  const handleStart = async () => {
    try {
      await startSession(25, taskId)
    } catch {
      // Error handled by hook
    }
  }

  const handleComplete = async () => {
    try {
      await completeSession()
      onSessionComplete?.()
    } catch {
      // Error handled by hook
    }
  }

  const handleCancel = async () => {
    try {
      await cancelSession()
    } catch {
      // Error handled by hook
    }
  }

  const handleReset = () => {
    resetSession()
    onSessionComplete?.()
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = session
    ? ((session.duration * 60 * 1000 - timeLeft) / (session.duration * 60 * 1000)) * 100
    : 0

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Pomodoro Timer</h3>
        {taskId && (
          <p className="text-xs text-gray-400 mb-4">Linked to task</p>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-900/30 text-red-300 text-sm rounded border border-red-800">
            {error}
          </div>
        )}

        {/* Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#374151"
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
            <span className="text-4xl font-bold text-gray-100">
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
                  ? 'bg-red-900/50 text-red-300'
                  : session.status === 'COMPLETED'
                  ? 'bg-green-900/50 text-green-300'
                  : 'bg-gray-700 text-gray-300'
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
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors font-medium"
            >
              Start Focus
            </button>
          )}

          {session?.status === 'RUNNING' && (
            <>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {(session?.status === 'COMPLETED' || session?.status === 'CANCELLED') && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors font-medium"
            >
              New Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
