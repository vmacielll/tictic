'use client'

import { useEffect } from 'react'
import { type Task } from '@/domain/tasks/types'
import { TaskDetailHeader } from './TaskDetailHeader'
import { TaskDetailForm } from './TaskDetailForm'
import type { List } from '@/domain/lists/types'

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleToggleComplete = async () => {
    const newCompleted = !task.completed
    onToggleComplete(task.id, newCompleted)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-slide-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface-overlay rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <TaskDetailHeader
          task={task}
          onClose={onClose}
          onToggleComplete={handleToggleComplete}
        />
        <TaskDetailForm
          task={task}
          onSave={onSave}
          onClose={onClose}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          lists={lists}
        />
      </div>
    </div>
  )
}
