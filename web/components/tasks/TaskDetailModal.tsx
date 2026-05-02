'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { type Task, type UpdateTaskInput, parseTask } from '@/domain/tasks/types'
import { updateTask } from '@/lib/api'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'

interface TaskDetailModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTask: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (taskId: string, completed: boolean) => void
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onToggleComplete,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
  const [dueTime, setDueTime] = useState(typeof task.dueTime === 'string' ? task.dueTime : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
    setDueTime(typeof task.dueTime === 'string' ? task.dueTime : '')
    setError(null)
  }, [task])

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: UpdateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
      }

      const raw = await updateTask(task.id, updateData)
      const updated = parseTask(raw)
      onSave(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async () => {
    try {
      const newCompleted = !task.completed
      await updateTask(task.id, { completed: newCompleted })
      onToggleComplete(task.id, newCompleted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      onDelete(task.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const priorityColors = {
    HIGH: 'bg-danger/10 text-danger/80 border-danger/30',
    MEDIUM: 'bg-warning/10 text-warning/80 border-warning/30',
    LOW: 'bg-success/10 text-success/80 border-success/30',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-slide-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface-overlay rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className={`sticky top-0 bg-surface-overlay border-b border-border px-6 py-4 rounded-t-xl ${task.completed ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={handleToggleComplete}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${task.completed ? 'bg-success border-success' : 'border-border-light hover:border-success/60'}`}
                aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {task.completed && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <h2 className={`text-xl font-semibold ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                Task Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Title *
            </label>
            <input
              type="text"
              data-testid="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent placeholder-text-muted"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description
            </label>
            <textarea
              data-testid="modal-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none placeholder-text-muted"
              rows={3}
              placeholder="Add a description (optional)"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium transition-all
                    ${priority === p
                      ? priorityColors[p]
                      : 'bg-surface-raised border-border-light text-text-secondary hover:bg-surface'
                    }`}
                >
                  {p === 'HIGH' ? '🔴' : p === 'MEDIUM' ? '🟡' : '🟢'} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Timezone (read-only) */}
          {task.dueTimezone && (
            <div className="text-sm text-text-muted">
              Timezone: {task.dueTimezone}
            </div>
          )}

          {/* Metadata (read-only) */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-secondary">Created:</span>
                <p className="text-text-primary">{formatDate(task.createdAt)}</p>
              </div>
              <div>
                <span className="text-text-secondary">Updated:</span>
                <p className="text-text-primary">{formatDate(task.updatedAt)}</p>
              </div>
              {task.completedAt && (
                <div>
                  <span className="text-text-secondary">Completed:</span>
                  <p className="text-text-primary">{formatDate(task.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pomodoro Section */}
          <div data-testid="task-detail-pomodoro" className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              🍅 Pomodoro Focus
            </h3>
            <PomodoroTimer taskId={task.id} onSessionComplete={() => {
              // Optionally refresh task data or show notification
            }} />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 rounded-b-xl flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            Delete Task
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-raised border border-border-light rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="modal-save-button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
