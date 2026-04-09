'use client'

import { type Task } from '@/lib/api'

const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  HIGH: { bg: 'bg-red-50', border: 'border-red-400' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-400' },
  LOW: { bg: 'bg-green-50', border: 'border-green-400' },
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onViewDetails?: (task: Task) => void
}

export function TaskItem({ task, onToggle, onDelete, onViewDetails }: TaskItemProps) {
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM

  return (
    <div
      data-testid={`task-item-${task.id}`}
      className={`group flex items-center gap-3 p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} hover:shadow-sm transition-shadow`}
    >
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onViewDetails?.(task)}
      >
        <p className={`text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 truncate">{task.description}</p>
        )}
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
        ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : ''}
        ${task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : ''}
        ${task.priority === 'LOW' ? 'bg-green-100 text-green-700' : ''}`}>
        {task.priority.charAt(0)}
      </span>

      {/* View details button - visible on hover */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(task)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary-600 transition-all"
          aria-label="View task details"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      )}

      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
