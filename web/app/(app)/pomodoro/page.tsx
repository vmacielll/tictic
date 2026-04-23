'use client'

import { usePomodoro } from '@/hooks/usePomodoro'

export default function PomodoroPage() {
  const { sessions, loading, error, refreshSessions } = usePomodoro()

  const handleSessionComplete = () => {
    refreshSessions()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-danger/10 text-danger/80'
      case 'COMPLETED':
        return 'bg-success/10 text-success/80'
      case 'CANCELLED':
        return 'bg-surface-overlay text-text-muted'
      default:
        return 'bg-surface-overlay text-text-muted'
    }
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pomodoro Timer</h1>
        <p className="text-sm text-text-muted mt-1">Stay focused and productive</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger/90">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-1">
          <PomodoroTimer onSessionComplete={handleSessionComplete} />
        </div>

        {/* Session History */}
        <div className="lg:col-span-2">
          <div className="bg-surface-raised border border-border-light rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Sessions</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-text-muted text-sm">No Pomodoro sessions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-light hover:bg-surface-overlay/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-400">
                          {session.duration}m
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {session.taskId ? `Task: ${session.taskId.slice(0, 8)}...` : 'Focus Session'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(session.startedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PomodoroTimer({ onSessionComplete }: { onSessionComplete?: () => void }) {
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
  } = usePomodoro()

  const handleStart = async () => {
    try { await startSession(25) } catch {}
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="bg-surface-raised border border-border-light rounded-xl p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Pomodoro Timer</h3>

        {error && (
          <div className="mb-4 p-2 bg-danger/10 text-danger/80 text-sm rounded border border-danger/20">
            {error}
          </div>
        )}

        {/* Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-6">
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
            <span className="text-4xl font-bold text-text-primary">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Status Badge */}
        {session && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              session.status === 'RUNNING' ? 'bg-primary-600/10 text-primary-400' :
              session.status === 'COMPLETED' ? 'bg-success/10 text-success/80' :
              'bg-surface-overlay text-text-muted'
            }`}>
              {session.status === 'RUNNING' ? 'Focusing' : session.status}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!session && (
            <button onClick={handleStart} disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition-all font-medium shadow-sm shadow-primary-600/20">
              Start Focus
            </button>
          )}

          {session?.status === 'RUNNING' && (
            <>
              <button onClick={handleComplete} disabled={loading}
                className="px-4 py-2.5 bg-success/10 text-success/80 rounded-lg hover:bg-success/20 disabled:opacity-50 transition-all font-medium">
                Complete
              </button>
              <button onClick={handleCancel} disabled={loading}
                className="px-4 py-2.5 bg-surface-overlay text-text-secondary rounded-lg hover:bg-surface-overlay/80 disabled:opacity-50 transition-all">
                Cancel
              </button>
            </>
          )}

          {(session?.status === 'COMPLETED' || session?.status === 'CANCELLED') && (
            <button onClick={handleReset} disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition-all font-medium shadow-sm shadow-primary-600/20">
              New Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
