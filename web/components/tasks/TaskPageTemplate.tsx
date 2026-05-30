'use client'

import { useTasks } from '@/hooks/useTasks'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useListsContext } from '@/contexts/ListsContext'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { DateTime } from 'luxon'

interface TaskPageTemplateProps {
  pageKey: 'today' | 'inbox'
  title: string
  subtitle: string
  emptyMessage: string
  showDate?: boolean
}

export function TaskPageTemplate({
  pageKey,
  title,
  subtitle,
  emptyMessage,
  showDate = false,
}: TaskPageTemplateProps) {
  const { tasks, loading, error, addTask, toggleTask, removeTask, updateTask, refresh } = useTasks(pageKey)
  const { lists } = useListsContext()

  // Use Luxon for date formatting (FR-02)
  const today = DateTime.now()
  const dateDisplay = today.toFormat('EEEE, MMMM d')
  const todayFormatted = today.toFormat('yyyy-MM-dd')

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
        <h1 data-testid="page-heading" className="text-2xl font-bold text-text-primary">{title}</h1>
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        {showDate && (
          <p className="text-sm text-text-muted capitalize">{dateDisplay}</p>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <TaskList
        tasks={tasks}
        loading={loading}
        emptyMessage={emptyMessage}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={removeTask}
        defaultDueDate={showDate ? todayFormatted : undefined}
        onViewDetails={openModal}
        lists={lists}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
          lists={lists}
        />
      )}
    </div>
  )
}
