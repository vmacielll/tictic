'use client'

import { type Task } from '@/lib/api'
import { TaskItem } from './TaskItem'
import { TaskForm } from './TaskForm'
import type { CreateTaskInput } from '@/lib/api'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  emptyMessage?: string
  onAddTask: (data: CreateTaskInput) => Promise<void>
  onToggleTask: (id: string, completed: boolean) => void
  onDeleteTask: (id: string) => void
  defaultDueDate?: string
  onViewDetails?: (task: Task) => void
}

export function TaskList({
  tasks,
  loading,
  emptyMessage = 'No tasks here yet',
  onAddTask,
  onToggleTask,
  onDeleteTask,
  defaultDueDate,
  onViewDetails,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={onAddTask} defaultDueDate={defaultDueDate} />

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}
