'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useListsContext } from '@/contexts/ListsContext'
import { useListTasks } from '@/hooks/useListTasks'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { Pagination } from '@/components/ui/Pagination'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useToast, ToastType, ToastMessage } from '@/components/ui/Toast'

export default function ListDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { lists, loading: listsLoading } = useListsContext()

  const list = lists.find((l) => l.id === id)

  const {
    tasks,
    loading: tasksLoading,
    error,
    page,
    totalPages,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    setPage,
    refresh,
  } = useListTasks(id)

  const { addToast } = useToast()

  const handleToggleTask = useCallback(
    async (taskId: string, completed: boolean) => {
      await toggleTask(taskId, completed)
      addToast(completed ? ToastMessage.TaskReopened : ToastMessage.TaskCompleted, ToastType.Success)
    },
    [toggleTask, addToast]
  )

  const {
    selectedTask,
    isModalOpen,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleComplete,
  } = useTaskDetail(
    useCallback(
      async (updatedTask) => {
        await updateTask(updatedTask.id, {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          dueDate: updatedTask.dueDate
            ? updatedTask.dueDate.toISOString().split('T')[0]
            : undefined,
          dueTime: updatedTask.dueTime || undefined,
        })
        await refresh()
        addToast(ToastMessage.TaskUpdated, ToastType.Success)
      },
      [updateTask, refresh, addToast]
    ),
    useCallback(
      async (taskId) => {
        await removeTask(taskId)
        addToast(ToastMessage.TaskDeleted, ToastType.Error)
      },
      [removeTask, addToast]
    ),
    handleToggleTask
  )

  if (listsLoading) {
    return (
      <div data-testid="list-detail-page" className="max-w-2xl animate-fade-in">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div data-testid="list-detail-page" className="max-w-2xl animate-fade-in">
        <div className="text-center py-12">
          <p className="text-text-muted text-lg">List not found</p>
          <Link
            href="/lists"
            className="mt-4 inline-block text-sm text-primary-500 hover:text-primary-400 transition-colors"
          >
            &larr; Back to Lists
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="list-detail-page" className="max-w-2xl animate-fade-in">
      <Link
        href="/lists"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Lists
      </Link>

      <div className="mb-6 flex items-center gap-3">
        {list.color && (
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: list.color }}
          />
        )}
        <div>
          <h1 data-testid="page-heading" className="text-2xl font-bold text-text-primary">{list.name}</h1>
          <p className="text-sm text-text-muted mt-1">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <TaskList
        tasks={tasks}
        loading={tasksLoading}
        emptyMessage="No tasks in this list"
        onAddTask={addTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={removeTask}
        onViewDetails={openModal}
        lists={lists}
      />

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

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
