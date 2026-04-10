'use client'

import { useState } from 'react'
import { useCalendar } from '@/hooks/useCalendar'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { type CalendarTask, updateTask, completeTask, uncompleteTask, deleteTask } from '@/lib/api'

// Helper to convert CalendarTask to Task format
function calendarTaskToTask(task: CalendarTask) {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      await updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        dueTime: updatedTask.dueTime,
      })
      await refresh()
      setCalendarRefreshKey(prev => prev + 1)
    },
    async (taskId) => {
      await deleteTask(taskId)
      await refresh()
      setCalendarRefreshKey(prev => prev + 1)
    },
    async (taskId, completed) => {
      await onToggleTask(taskId, completed)
    }
  )

  const handleViewTask = (task: CalendarTask) => {
    openModal(calendarTaskToTask(task))
  }

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const weekLabel = `Week of ${currentDate.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}`
  const dayLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={goToPrev} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
            ←
          </button>
          <button onClick={goToToday} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors">
            Today
          </button>
          <button onClick={goToNext} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
            →
          </button>
          <h1 className="text-xl font-semibold capitalize" data-testid="calendar-heading">
            {view === 'month' ? monthLabel : view === 'week' ? weekLabel : dayLabel}
          </h1>
        </div>

        <div className="flex items-center bg-gray-700 rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === v ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 text-red-300 text-sm border-b border-red-800">
          {error}
        </div>
      )}

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
      {view === 'day' && singleDay && (
        <DayView 
          date={singleDay.date} 
          tasks={singleDay.tasks} 
          loading={loading}
          onToggleTask={onToggleTask}
          onViewTask={handleViewTask}
        />
      )}
      {view === 'day' && !singleDay && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <DayView 
            date={new Date().toISOString().split('T')[0]} 
            tasks={[]} 
            loading={false}
            onToggleTask={onToggleTask}
            onViewTask={handleViewTask}
          />
        </div>
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
