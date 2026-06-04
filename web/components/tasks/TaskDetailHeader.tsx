import { type Task } from '@/domain/tasks/types'
import { Icon } from '@/components/ui/Icon'

interface TaskDetailHeaderProps {
  task: Task
  onClose: () => void
  onToggleComplete: () => void
}

export function TaskDetailHeader({ task, onClose, onToggleComplete }: TaskDetailHeaderProps) {
  return (
    <div className="sticky top-0 bg-surface-overlay border-b border-border px-6 py-4 md:rounded-t-xl z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggleComplete}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
              ${task.completed ? 'bg-success border-success' : 'border-border-light hover:border-success/60'}`}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed && <Icon name="check" className="w-4 h-4 text-white" />}
          </button>
          <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
            Task Details
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
