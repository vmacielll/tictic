'use client'

import { type CalendarDay, type CalendarTask } from '@/lib/api'

interface MonthViewProps {
  days: CalendarDay[]
  loading: boolean
  onDayClick: (date: Date) => void
  onToggleTask?: (id: string, completed: boolean) => void
  onViewTask?: (task: CalendarTask) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Helper to parse date string (YYYY-MM-DD) without timezone conversion
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function MonthView({ days, loading, onDayClick, onToggleTask, onViewTask }: MonthViewProps) {
  const firstDayDate = days[0]?.date ? parseDateString(days[0].date) : new Date()
  const startDayOfWeek = firstDayDate.getDay()
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const tasksByDate = new Map(days.map((d) => [d.date, d.tasks]))
  const allDates: (CalendarTask[] | null)[] = []

  for (let i = 0; i < paddingDays; i++) allDates.push(null)
  for (const day of days) allDates.push(day.tasks)

  const totalCells = Math.ceil(allDates.length / 7) * 7

  return (
    <div className="flex-1 overflow-auto">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="grid grid-cols-7 border-b border-gray-700">
            {DAY_NAMES.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-medium text-gray-400 uppercase">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr" data-testid="calendar-month-grid">
            {Array.from({ length: totalCells }).map((_, index) => {
              const tasks = allDates[index]
              const dayCell = tasks !== null ? (
                (() => {
                  const dateStr = days.find((d) => d.tasks === tasks)?.date
                  const date = dateStr ? parseDateString(dateStr) : null
                  const isToday = date
                    ? date.toDateString() === new Date().toDateString()
                    : false

                  return (
                    <div
                      key={index}
                      data-testid={`calendar-day-cell-${dateStr || `empty-${index}`}`}
                      data-date={dateStr || ''}
                      className={`border border-gray-700/50 p-1 min-h-[80px] cursor-pointer hover:bg-gray-700/30 transition-colors ${
                        !date ? 'opacity-30' : ''
                      }`}
                      onClick={() => date && onDayClick(date)}
                    >
                      {date && (
                        <>
                          <span
                            data-testid="calendar-day-number"
                            className={`text-xs font-medium inline-block mb-1 px-1.5 py-0.5 rounded-full ${
                              isToday
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-300'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <div className="space-y-0.5 overflow-hidden">
                            {tasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${
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
                                  }
                                }}
                              >
                                {onToggleTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onToggleTask(task.id, task.completed)
                                    }}
                                    className={`w-2.5 h-2.5 rounded border flex-shrink-0 flex items-center justify-center ${
                                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    }`}
                                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                  >
                                    {task.completed && (
                                      <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {tasks.length > 3 && (
                              <div className="text-xs text-gray-500 pl-1">+{tasks.length - 3}</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div key={index} className="border border-gray-700/50 min-h-[80px] opacity-20" />
              )
              return dayCell
            })}
          </div>
        </div>
      )}
    </div>
  )
}
