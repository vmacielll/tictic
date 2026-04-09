'use client'

import { type CalendarTask } from '@/lib/api'

interface DayViewProps {
  date: string
  tasks: CalendarTask[]
  loading: boolean
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarTask) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-400',
}

export function DayView({ date, tasks, loading, onToggleTask, onViewTask }: DayViewProps) {
  // Parse date string directly without timezone conversion
  // The date string from backend is already in user's timezone (YYYY-MM-DD)
  const [year, month, day] = date.split('-').map(Number)
  const displayDate = new Date(year, month - 1, day) // Local date, no UTC conversion
  const weekday = displayDate.toLocaleDateString('pt-BR', { weekday: 'long' })
  const monthName = displayDate.toLocaleDateString('pt-BR', { month: 'long' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h2 data-testid="calendar-day-view-heading" className="text-2xl font-bold text-gray-100 mb-1 capitalize">
          {weekday}
        </h2>
        <p className="text-gray-400 mb-6">
          {day} de {monthName}
        </p>

        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No tasks for this day</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border-l-4 ${
                  task.completed
                    ? 'bg-gray-800/50 border-gray-600'
                    : task.priority === 'HIGH'
                    ? 'bg-gray-800 border-red-500'
                    : task.priority === 'MEDIUM'
                    ? 'bg-gray-800 border-yellow-500'
                    : 'bg-gray-800 border-green-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {onToggleTask && (
                    <button
                      onClick={() => onToggleTask(task.id, task.completed)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                      }`}
                      aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                  <h3 
                    className={`text-base flex-1 cursor-pointer ${task.completed ? 'line-through text-gray-400' : 'text-gray-100 hover:underline'}`}
                    onClick={() => onViewTask?.(task)}
                  >
                    {task.title}
                  </h3>
                  {task.completed && (
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
                      Done
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-400 mt-2">{task.description}</p>
                )}
                {task.dueTime && (
                  <p className="text-xs text-gray-500 mt-1">{task.dueTime}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
