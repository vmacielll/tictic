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
    try { await startSession(25, taskId) } catch {}
  }

  const handleComplete = async () => {
    try { await completeSession(); onSessionComplete?.() } catch {}
  }

  const handleCancel = async () => {
    try { await cancelSession() } catch {}
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
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="bg-surface-raised border border-border-light rounded-xl p-5">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Pomodoro Timer</h3>
        {taskId && <p className="text-xs text-text-muted mb-3">Linked to task</p>}

        {error && (
          <div className="mb-3 p-2 bg-danger/10 text-danger/80 text-xs rounded border border-danger/20">
            {error}
          </div>
        )}

        {/* Timer Display */}
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={session?.status === 'COMPLETED' ? '#22c55e' : '#8b5cf6'}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-text-primary">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Status Badge */}
        {session && (
          <div className="mb-3">
            <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
              session.status === 'RUNNING' ? 'bg-primary-600/10 text-primary-400' :
              session.status === 'COMPLETED' ? 'bg-success/10 text-success/80' :
              'bg-surface-overlay text-text-muted'
            }`}>
              {session.status === 'RUNNING' ? 'Focusing' : session.status}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!session && (
            <button 
              data-testid="pomodoro-start-button"
              onClick={handleStart} disabled={loading}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition-all text-sm font-medium shadow-sm shadow-primary-600/20">
              Start Focus
            </button>
          )}

          {session?.status === 'RUNNING' && (
            <>
              <button 
                data-testid="pomodoro-complete-button"
                onClick={handleComplete} disabled={loading}
                className="px-3 py-2 bg-success/10 text-success/80 rounded-lg hover:bg-success/20 disabled:opacity-50 transition-all text-sm font-medium">
                Complete
              </button>
              <button 
                data-testid="pomodoro-cancel-button"
                onClick={handleCancel} disabled={loading}
                className="px-3 py-2 bg-surface-overlay text-text-secondary rounded-lg hover:bg-surface-overlay/80 disabled:opacity-50 transition-all text-sm">
                Cancel
              </button>
            </>
          )}

          {(session?.status === 'COMPLETED' || session?.status === 'CANCELLED') && (
            <button 
              data-testid="pomodoro-new-session-button"
              onClick={handleReset} disabled={loading}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition-all text-sm font-medium shadow-sm shadow-primary-600/20">
              New Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
