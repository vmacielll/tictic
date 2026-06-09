'use client'

import { DateTime } from 'luxon'
import { type CalendarDay } from '@/domain/calendar/types'
import { type CalendarSummaryTask } from '@/domain/calendar/types'

interface MonthViewProps {
  days: CalendarDay[]
  loading: boolean
  onDayClick: (date: Date) => void
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarSummaryTask) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function MonthView({ days, loading, onDayClick, onToggleTask, onViewTask }: MonthViewProps) {
  const firstDayDate = days[0]?.date ? parseDateString(days[0].date) : DateTime.now().toJSDate()
  const startDayOfWeek = firstDayDate.getDay()
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const allDates: (CalendarSummaryTask[] | null)[] = []
  for (let i = 0; i < paddingDays; i++) allDates.push(null)
  for (const day of days) allDates.push(day.tasks)

  const totalCells = Math.ceil(allDates.length / 7) * 7

  return (
    <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden" data-testid="calendar-month-grid">
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-medium text-text-muted uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-7 auto-rows-fr">
        {Array.from({ length: totalCells }).map((_, index) => {
          const tasks = allDates[index]
          if (tasks === null) {
            return <div key={index} className="border border-border/30 min-h-[80px]" />
          }
          const dateStr = days.find((d) => d.tasks === tasks)?.date
          const date = dateStr ? parseDateString(dateStr) : null
          const isToday = date ? date.toDateString() === DateTime.now().toJSDate().toDateString() : false

          return (
            <div
              key={index}
              data-testid={`calendar-day-cell-${dateStr || `empty-${index}`}`}
              data-date={dateStr || ''}
              className="border border-border/30 p-1.5 min-h-[80px] sm:min-h-[100px] cursor-pointer hover:bg-surface-overlay/50 transition-colors"
              onClick={() => date && onDayClick(date)}
            >
              {date && (
                <>
<span
                     data-testid="calendar-day-number"
                     className={`text-xs font-medium inline-block mb-1 px-1.5 py-0.5 rounded-full ${
                       isToday ? 'bg-primary-600 text-white' : 'text-text-secondary'
                     }`}
                   >
                     {date.getDate()}
                   </span>
                   <div className="space-y-0.5 overflow-hidden">
                     {tasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
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
                            className={`w-2.5 h-2.5 rounded border flex-shrink-0 flex items-center justify-center ${
                              task.completed ? 'bg-primary-600 border-primary-600' : 'border-border-light'
                            }`}
                            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {task.completed && (
                              <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {tasks.length > 2 && (
                      <div className="text-xs text-text-muted pl-1.5">+{tasks.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
          </div>
        )}
    </div>
  )
}
