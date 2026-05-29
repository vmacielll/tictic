'use client'

import { type CalendarDetailTask } from '@/domain/calendar/types'

interface DayViewProps {
  date?: string
  tasks?: CalendarDetailTask[]
  loading: boolean
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarDetailTask) => void
}

export function DayView({ date, tasks = [], loading, onToggleTask, onViewTask }: DayViewProps) {
  if (!date) {
    return (
      <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden w-full" data-testid="calendar-day-view">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    )
  }

  const [year, month, day] = date.split('-').map(Number)
  const displayDate = new Date(year, month - 1, day)
  const weekday = displayDate.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = displayDate.toLocaleDateString('en-US', { month: 'long' })

  if (loading) {
    return (
      <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden w-full" data-testid="calendar-day-view">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden w-full" data-testid="calendar-day-view">
      <div className="p-4">
        <h2 data-testid="calendar-day-view-heading" className="text-2xl font-bold text-text-primary mb-1 capitalize">
          {weekday}
        </h2>
        <p className="text-text-muted mb-6">
          {monthName} {day}
        </p>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-text-muted text-sm">No tasks for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border border-border-light border-l-4 ${
                  task.completed
                    ? 'bg-surface-overlay/50 border-l-border'
                    : task.priority === 'HIGH'
                    ? 'bg-red-950/40 border-l-red-700/60'
                    : task.priority === 'MEDIUM'
                    ? 'bg-amber-950/40 border-l-amber-700/60'
                    : 'bg-emerald-950/40 border-l-emerald-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {onToggleTask && (
                    <button
                      onClick={() => onToggleTask(task.id, task.completed)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed ? 'bg-primary-600 border-primary-600' : 'border-border-light hover:border-primary-500/50'
                      }`}
                      aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    task.priority === 'HIGH' ? 'bg-red-950/60 text-red-300 border border-red-900/40' :
                    task.priority === 'MEDIUM' ? 'bg-amber-950/60 text-amber-300 border border-amber-900/40' :
                    'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40'
                  }`}>
                    {task.priority}
                  </span>
                  <h3
                    className={`text-base flex-1 cursor-pointer ${task.completed ? 'line-through text-text-muted' : 'text-text-primary hover:underline'}`}
                    onClick={() => onViewTask?.(task)}
                  >
                    {task.title}
                  </h3>
                  {task.completed && (
                    <span className="text-xs bg-success/10 text-success/80 px-2 py-0.5 rounded">
                      Done
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-text-muted mt-2">{task.description}</p>
                )}
                {task.dueTime && (
                  <p className="text-xs text-text-muted mt-1">{task.dueTime}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}