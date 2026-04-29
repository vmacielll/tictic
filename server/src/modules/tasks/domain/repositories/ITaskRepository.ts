import type { Task } from '../entities/Task'
import type { Priority } from '../types/Priority'

interface PaginationParams {
  skip?: number
  take?: number
}

export type { PaginationParams }

export interface ITaskRepository {
  create(task: {
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
  }): Promise<Task>
  findById(id: string, userId: string): Promise<Task | null>
  findByUserId(userId: string, pagination?: PaginationParams): Promise<Task[]>
  findByUserIdAndDate(userId: string, date: string, pagination?: PaginationParams): Promise<Task[]>
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]>
  findByDueDate(userId: string, date: string): Promise<Task[]>
  findInboxByUserId(userId: string): Promise<Task[]>
  save(task: Task): Promise<Task>
  delete(id: string, userId: string): Promise<void>
  countByUserId(userId: string): Promise<number>
}