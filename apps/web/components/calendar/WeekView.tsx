'use client'

import { type CalendarDay } from '@/lib/api'

interface WeekViewProps {
  days: CalendarDay[]
  loading: boolean
  onDayClick: (date: Date) => void
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarDay['tasks'][0]) => void
}

export function WeekView({ days, loading, onDayClick, onToggleTask, onViewTask }: WeekViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 divide-x divide-gray-700 min-h-full" data-testid="calendar-week-grid">
        {days.map((day) => {
          // Parse date string directly without timezone conversion
          const [year, month, dateDay] = day.date.split('-').map(Number)
          const date = new Date(year, month - 1, dateDay) // Local date
          const isToday = date.toDateString() === new Date().toDateString()
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })

          return (
            <div key={day.date} data-testid={`calendar-week-day-${day.date}`} className="p-2 min-h-[300px] cursor-pointer hover:bg-gray-700/20 transition-colors">
              <div className="text-center mb-2">
                <div className="text-xs text-gray-400 uppercase">{dayName}</div>
                <span
                  className={`inline-block text-lg font-bold px-2 py-1 rounded-full mt-1 ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-200'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-1" onClick={(e) => {
                // Only navigate if clicking on the day container, not on tasks
                if (e.target === e.currentTarget) {
                  onDayClick(date)
                }
              }}>
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`text-sm px-2 py-1 rounded flex items-center gap-1 ${
                      task.completed
                        ? 'bg-gray-600/50 line-through text-gray-400'
                        : task.priority === 'HIGH'
                        ? 'bg-red-900/50 text-red-300'
                        : task.priority === 'MEDIUM'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-green-900/50 text-green-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleTask) {
                        onToggleTask(task.id, task.completed)
                      } else {
                        onDayClick(date)
                      }
                    }}
                  >
                    {onToggleTask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleTask(task.id, task.completed)
                        }}
                        className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                          task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                    <span 
                      className="truncate flex-1 cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewTask?.(task)
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
