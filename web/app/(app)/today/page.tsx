'use client'

import { useTasks } from '@/hooks/useTasks'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

export default function TodayPage() {
  const { tasks, loading, error, addTask, toggleTask, removeTask, updateTask, refresh } = useTasks('today')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Format today's date as YYYY-MM-DD for the date input
  const todayFormatted = new Date().toISOString().split('T')[0]

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
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString().split('T')[0] : undefined,
        dueTime: updatedTask.dueTime || undefined,
      })
      await refresh()
    },
    async (taskId) => {
      await removeTask(taskId)
    },
    async (taskId, completed) => {
      await toggleTask(taskId, completed)
    }
  )

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 data-testid="page-heading" className="text-2xl font-bold text-text-primary">Today</h1>
        <p className="text-sm text-text-muted mt-1 capitalize">{today}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger/90">
          {error}
        </div>
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        emptyMessage="No tasks for today"
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={removeTask}
        defaultDueDate={todayFormatted}
        onViewDetails={openModal}
      />

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
