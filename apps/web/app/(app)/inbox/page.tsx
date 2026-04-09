'use client'

import { useTasks } from '@/hooks/useTasks'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

export default function InboxPage() {
  const { tasks, loading, error, addTask, toggleTask, removeTask, updateTask, refresh } = useTasks('inbox')

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
    },
    async (taskId) => {
      await removeTask(taskId)
    },
    async (taskId, completed) => {
      await toggleTask(taskId, completed)
    }
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">Quick capture your tasks</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        emptyMessage="Your inbox is empty — add a task above!"
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={removeTask}
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
