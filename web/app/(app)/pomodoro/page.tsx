'use client'

import { usePomodoro } from '@/hooks/usePomodoro'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

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
        <h1 data-testid="page-heading" className="text-2xl font-bold text-text-primary">Pomodoro Timer</h1>
        <p className="text-sm text-text-muted mt-1">Stay focused and productive</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-1">
          <PomodoroTimer onSessionComplete={handleSessionComplete} />
        </div>

        {/* Session History */}
        <div className="lg:col-span-2">
          <div className="bg-surface-raised border border-border-light rounded-xl p-6">
            <h3 data-testid="recent-sessions-heading" className="text-lg font-semibold text-text-primary mb-4">Recent Sessions</h3>

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
                          {session.taskTitle || 'Focus Session'}
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
