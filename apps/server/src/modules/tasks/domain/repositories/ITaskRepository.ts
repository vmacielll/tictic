import type { Task } from '../entities/Task'
import type { Priority } from '../types/Priority'

export interface ITaskRepository {
  create(task: {
    id: string
    title: string
    description?: string
    priority: Priority
    dueDate?: Date
    dueTime?: Date
    completed: boolean
    completedAt?: Date
    listId?: string
    userId: string
  }): Promise<Task>
  findById(id: string): Promise<Task | null>
  findByUserId(userId: string): Promise<Task[]>
  findByUserIdAndDate(userId: string, date: Date): Promise<Task[]>
  findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]>
  findInboxByUserId(userId: string): Promise<Task[]>
  save(task: Task): Promise<Task>
  delete(id: string): Promise<void>
}
