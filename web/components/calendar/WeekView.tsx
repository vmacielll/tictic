'use client'

import { DateTime } from 'luxon'
import { type CalendarDay } from '@/domain/calendar/types'
import { type CalendarSummaryTask } from '@/domain/calendar/types'

interface WeekViewProps {
  days: CalendarDay[]
  loading: boolean
  onDayClick: (date: Date) => void
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarSummaryTask) => void
}

export function WeekView({ days, loading, onDayClick, onToggleTask, onViewTask }: WeekViewProps) {
  return (
    <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden w-full" data-testid="calendar-week-grid">
    {loading ? (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    ) : (
      <div className="grid grid-cols-7 divide-x divide-border min-h-[400px] w-full">
        {days.map((day) => {
          const [year, month, dateDay] = day.date.split('-').map(Number)
          const date = new Date(year, month - 1, dateDay)
          const isToday = date.toDateString() === DateTime.now().toJSDate().toDateString()
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

          return (
            <div key={day.date} data-testid={`calendar-week-day-${day.date}`} className="p-2 min-h-[300px] cursor-pointer hover:bg-surface-overlay/30 transition-colors">
              <div className="text-center mb-2">
                <div className="text-xs text-text-muted uppercase">{dayName}</div>
                <span
                  className={`inline-block text-lg font-bold px-2 py-1 rounded-full mt-1 ${
                    isToday ? 'bg-primary-600 text-white' : 'text-text-primary'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-1" onClick={(e) => {
                if (e.target === e.currentTarget) onDayClick(date)
              }}>
                {day.tasks.map((task: CalendarSummaryTask) => (
                  <div
                    key={task.id}
                    className={`text-sm px-2 py-1 rounded flex items-center gap-1 ${
                      task.completed
                        ? 'bg-surface-overlay/50 line-through text-text-muted'
                        : task.priority === 'HIGH'
                        ? 'bg-red-950/60 text-red-300 border border-red-900/40'
                        : task.priority === 'MEDIUM'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-900/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleTask) onToggleTask(task.id, task.completed)
                    }}
                  >
                    {onToggleTask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleTask(task.id, task.completed)
                        }}
                        className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                          task.completed ? 'bg-primary-600 border-primary-600' : 'border-border-light'
                        }`}
                        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
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
    )}
    </div>
  )
}
