'use client'

import { useState, useEffect } from 'react'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'
import { listPomodoros, type PomodoroSession } from '@/lib/api'

export default function PomodoroPage() {
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function loadSessions() {
    try {
      const { pomodoroSessions } = await listPomodoros()
      setSessions(pomodoroSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleSessionComplete = () => {
    loadSessions()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-red-100 text-red-700'
      case 'COMPLETED':
        return 'bg-green-100 text-green-700'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pomodoro Timer</h1>
          <p className="text-gray-600 mt-1">Stay focused and productive</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer */}
          <div className="lg:col-span-1">
            <PomodoroTimer onSessionComplete={handleSessionComplete} />
          </div>

          {/* Session History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Pomodoro sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                          <span className="text-sm font-medium text-red-600">
                            {session.duration}m
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.taskId ? `Task: ${session.taskId.slice(0, 8)}...` : 'Focus Session'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.startedAt).toLocaleString('pt-BR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          session.status,
                        )}`}
                      >
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
    </div>
  )
}
