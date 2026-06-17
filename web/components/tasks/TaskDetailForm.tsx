import { useState, useEffect, type FormEvent } from 'react'
import { type Task, type UpdateTaskInput, parseTask } from '@/domain/tasks/types'
import { updateTask } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { List } from '@/domain/lists/types'

interface TaskDetailFormProps {
  task: Task
  onSave: (updatedTask: Task) => void
  onClose: () => void
  onDelete: (taskId: string) => void
  lists?: List[]
}

const priorityColors = {
  HIGH: 'bg-danger/10 text-danger/80 border-danger/30',
  MEDIUM: 'bg-warning/10 text-warning/80 border-warning/30',
  LOW: 'bg-success/10 text-success/80 border-success/30',
}

export function TaskDetailForm({ task, onSave, onClose, onDelete, lists }: TaskDetailFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
  const [dueTime, setDueTime] = useState(typeof task.dueTime === 'string' ? task.dueTime : '')
  const [listId, setListId] = useState<string | undefined>(task.listId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
    setDueTime(typeof task.dueTime === 'string' ? task.dueTime : '')
    setListId(task.listId)
    setError(null)
  }, [task])

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
        listId,
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

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    setShowDeleteConfirm(false)
    onDelete(task.id)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      {error && (
        <div className="mx-6 mt-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

      <Input
        data-testid="modal-title-input"
        label="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task title"
        required
        autoFocus
      />

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
        <textarea
          data-testid="modal-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border-light bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none placeholder-text-muted"
          rows={3}
          placeholder="Add a description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Priority</label>
        <div className="flex gap-2">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => {
            const label = `${p.charAt(0) + p.slice(1).toLowerCase()} priority`
            return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-label={label}
              title={label}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium transition-all
                ${priority === p ? priorityColors[p] : 'bg-surface-raised border-border-light text-text-secondary hover:bg-surface'}`}
            >
              <span aria-hidden="true">{p === 'HIGH' ? '🔴' : p === 'MEDIUM' ? '🟡' : '🟢'}</span> {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
            )
          })}
        </div>
      </div>

      {lists && lists.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">List</label>
          <select
            data-testid="modal-list-select"
            value={listId || ''}
            onChange={(e) => setListId(e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm bg-surface-raised border border-border-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">No list (Inbox)</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Input
          type="time"
          label="Due Time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
        />
      </div>

      {task.dueTimezone && (
        <div className="text-sm text-text-muted">Timezone: {task.dueTimezone}</div>
      )}

      <div className="pt-4 border-t border-border">
        <button
          type="button"
          data-testid="pomodoro-toggle"
          onClick={() => setShowPomodoro(!showPomodoro)}
          className="w-full flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wide hover:text-text-primary transition-colors"
        >
          <span>🍅 Pomodoro Focus</span>
          <span className={`transform transition-transform ${showPomodoro ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {showPomodoro && (
          <div className="mt-3" data-testid="task-detail-pomodoro">
            <PomodoroTimer taskId={task.id} onSessionComplete={() => {}} />
          </div>
        )}
      </div>

      </div>

      <div className="bg-surface border-t border-border px-6 py-4 md:rounded-b-xl flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleDelete}
          data-testid="delete-task-button"
          className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
        >
          Delete Task
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-raised border border-border-light rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            data-testid="modal-save-button"
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </form>
  )
}
