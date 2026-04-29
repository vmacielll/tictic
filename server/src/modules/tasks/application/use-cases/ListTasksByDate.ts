import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { Priority } from '../../domain/types/Priority'

interface ListTasksByDateRequest {
  userId: string
  date: string
  timezone: string
}

interface ListTasksByDateResponse {
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
  createdAt: Date
  updatedAt: Date
}

export class ListTasksByDate {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksByDateRequest): Promise<ListTasksByDateResponse[]> {
    const { userId, date } = request

    const tasks = await this.taskRepository.findByDueDate(userId, date)
    return tasks.map(this.toResponse)
  }

  private toResponse(task: { id: string; title: { value: string }; description?: string; priority: Priority; dueDate?: string; dueTime?: string; dueTimezone?: string; completed: boolean; completedAt?: Date; listId?: string; createdAt: Date; updatedAt: Date }): ListTasksByDateResponse {
    return {
      id: task.id,
      title: task.title.value,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      dueTimezone: task.dueTimezone,
      completed: task.completed,
      completedAt: task.completedAt,
      listId: task.listId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}