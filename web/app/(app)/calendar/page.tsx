'use client'

import { useState } from 'react'
import { useCalendar } from '@/hooks/useCalendar'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { useTasks } from '@/hooks/useTasks'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { type CalendarDetailTask } from '@/domain/calendar/types'
import { type Task } from '@/domain/tasks/types'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useToast } from '@/components/ui/Toast'
import { DateTime } from 'luxon'

function toTask(task: CalendarDetailTask): Task {
  const now = DateTime.now().toJSDate()
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    completed: task.completed,
    completedAt: undefined,
    listId: task.listId,
    userId: '',
    createdAt: now,
    updatedAt: now,
  }
}

export default function CalendarPage() {
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const {
    view,
    setView,
    currentDate,
    days,
    singleDay,
    loading,
    error,
    goToPrev,
    goToNext,
    goToToday,
    goToDay,
    onToggleTask,
    refresh,
  } = useCalendar('month')

  const { updateTask: updateTaskMutation, removeTask } = useTasks('inbox')
  const { addToast } = useToast()

  const {
    selectedTask,
    isModalOpen,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleComplete,
  } = useTaskDetail(
    async (updatedTask) => {
      await updateTaskMutation(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString().split('T')[0] : undefined,
        dueTime: updatedTask.dueTime || undefined,
      })
      await refresh()
      setCalendarRefreshKey(prev => prev + 1)
      addToast('Task updated', 'success')
    },
    async (taskId) => {
      await removeTask(taskId)
      await refresh()
      setCalendarRefreshKey(prev => prev + 1)
      addToast('Task deleted', 'success')
    },
    async (taskId, completed) => {
      await onToggleTask(taskId, completed)
      addToast(completed ? 'Task completed' : 'Task reopened', 'success')
    }
  )

  const handleViewTask = (task: CalendarDetailTask) => {
    openModal(task.id)
  }

  // Use Luxon for date formatting (FR-02)
  const currentDateTime = DateTime.fromJSDate(currentDate)
  const monthLabel = currentDateTime.toFormat('MMMM yyyy')
  const weekLabel = `Week of ${currentDateTime.toFormat('MMM d')}`
  const dayLabel = currentDateTime.toFormat('MMMM d, yyyy')
  const headingLabel = view === 'month' ? monthLabel : view === 'week' ? weekLabel : dayLabel

  return (
    <div className="max-w-5xl animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button data-testid="calendar-prev-btn" onClick={goToPrev} className="px-3 py-2 sm:py-2 bg-surface-raised border border-border-light rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-all min-h-[44px] sm:min-h-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button data-testid="calendar-today-btn" onClick={goToToday} className="px-3 py-2 sm:py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-all shadow-sm shadow-primary-600/20 min-h-[44px] sm:min-h-0">
            Today
          </button>
          <button data-testid="calendar-next-btn" onClick={goToNext} className="px-3 py-2 sm:py-2 bg-surface-raised border border-border-light rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-all min-h-[44px] sm:min-h-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-text-primary capitalize ml-2" data-testid="calendar-heading">
            {headingLabel}
          </h1>
        </div>

        <div className="flex items-center justify-center bg-surface-raised border border-border-light rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              data-testid={`calendar-view-${v}`}
              onClick={() => setView(v)}
              className={`px-3 py-2 sm:py-1.5 text-sm rounded-md font-medium transition-all min-h-[44px] sm:min-h-0 ${
                view === v ? 'bg-primary-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
              }`}
            >
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Views */}
      {view === 'month' && (
        <MonthView
          days={days}
          loading={loading}
          onDayClick={goToDay}
          onToggleTask={onToggleTask}
          onViewTask={handleViewTask}
        />
      )}
      {view === 'week' && (
        <WeekView
          days={days}
          loading={loading}
          onDayClick={goToDay}
          onToggleTask={onToggleTask}
          onViewTask={handleViewTask}
        />
      )}
      {view === 'day' && (
        <DayView
          date={singleDay?.date}
          tasks={singleDay?.tasks}
          loading={loading}
          onToggleTask={onToggleTask}
          onViewTask={handleViewTask}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  )
}
