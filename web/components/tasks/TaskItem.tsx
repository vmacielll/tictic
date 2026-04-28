'use client'

import { type Task } from '@/domain/tasks/types'

const PRIORITY_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  HIGH: { border: 'border-l-red-700/60', badge: 'bg-red-950/60 text-red-300 border border-red-900/40', label: 'H' },
  MEDIUM: { border: 'border-l-amber-700/60', badge: 'bg-amber-950/60 text-amber-300 border border-amber-900/40', label: 'M' },
  LOW: { border: 'border-l-emerald-700/60', badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40', label: 'L' },
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onViewDetails?: (task: Task) => void
}

export function TaskItem({ task, onToggle, onDelete, onViewDetails }: TaskItemProps) {
  const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM

  return (
    <div
      data-testid={`task-item-${task.id}`}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border border-l-4 ${style.border} bg-surface-raised hover:bg-surface-overlay transition-all duration-150 animate-fade-in`}
    >
      {/* Checkbox */}
      <button
        data-testid="task-complete-button"
        onClick={() => onToggle(task.id, task.completed)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${task.completed
            ? 'bg-primary-600 border-primary-600'
            : 'border-border-light hover:border-primary-500/50'
          }`}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onViewDetails?.(task)}
      >
        <p className={`text-sm truncate transition-colors ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-text-muted truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Priority badge */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums ${style.badge}`}>
        {style.label}
      </span>

      {/* View details button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(task)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-text-primary transition-all"
          aria-label="View task details"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </button>
      )}

      {/* Delete button */}
      <button
        data-testid="task-delete-button"
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger transition-all"
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
