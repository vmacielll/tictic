'use client'

import { useEffect } from 'react'
import { type Task } from '@/domain/tasks/types'
import { TaskDetailHeader } from './TaskDetailHeader'
import { TaskDetailForm } from './TaskDetailForm'
import type { List } from '@/domain/lists/types'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useInertApp } from '@/hooks/useInertApp'

interface TaskDetailModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTask: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (taskId: string, completed: boolean) => void
  lists?: List[]
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onToggleComplete,
  lists,
}: TaskDetailModalProps) {
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  useBodyScrollLock(isOpen)
  useInertApp(isOpen)

  if (!isOpen) return null

  const handleToggleComplete = async () => {
    const newCompleted = !task.completed
    onToggleComplete(task.id, newCompleted)
  }

  return (
    <div
      data-testid="task-detail-modal"
      className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center md:p-4 animate-slide-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal — full-screen on mobile, centered card on desktop */}
      <div className="relative bg-surface-overlay md:rounded-xl shadow-2xl w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col border-t md:border border-border" onClick={(e) => e.stopPropagation()}>
        <TaskDetailHeader
          task={task}
          onClose={onClose}
          onToggleComplete={handleToggleComplete}
        />
        <div className="flex-1 overflow-hidden flex flex-col">
          <TaskDetailForm
            task={task}
            onSave={onSave}
            onClose={onClose}
            onDelete={onDelete}
            lists={lists}
          />
        </div>
      </div>
    </div>
  )
}
