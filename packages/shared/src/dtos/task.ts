import type { Priority } from '../types/task'

export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  dueTime?: string
  listId?: string
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  priority?: Priority
  dueDate?: string
  dueTime?: string
  listId?: string
}

export interface TaskResponse {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: string
  dueTime?: string
  completed: boolean
  completedAt?: string
  listId?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CompleteTaskResponse {
  id: string
  completed: boolean
  completedAt?: string
  updatedAt: string
}
