import type { Priority } from '../../domain/types/Priority'

export interface TaskResponse {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  dueTime?: string
  dueTimezone?: string
  completed: boolean
  completedAt?: Date
  listId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Maps a task entity (domain or repository layer) to a standardized API response.
 * Handles both domain entities (where title is a value object with .value) and
 * plain repository-layer objects (where title is a string).
 */
export function toTaskResponse(task: {
  id: string
  title: { value: string } | string
  description?: string
  priority: Priority
  dueDate?: string
  dueTime?: string
  dueTimezone?: string
  completed: boolean
  completedAt?: Date
  listId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}): TaskResponse {
  const title = typeof task.title === 'string' ? task.title : task.title.value
  return {
    id: task.id,
    title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    dueTimezone: task.dueTimezone,
    completed: task.completed,
    completedAt: task.completedAt,
    listId: task.listId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}
