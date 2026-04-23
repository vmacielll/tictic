import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { Priority } from '../../domain/types/Priority'

interface ListInboxTasksRequest {
  userId: string
}

interface ListInboxTasksResponse {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: Date
  dueTime?: Date
  completed: boolean
  completedAt?: Date
  listId?: string
  createdAt: Date
  updatedAt: Date
}

export class ListInboxTasks {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListInboxTasksRequest): Promise<ListInboxTasksResponse[]> {
    const tasks = await this.taskRepository.findInboxByUserId(request.userId)
    return tasks.map(this.toResponse)
  }

  private toResponse(task: { id: string; title: { value: string }; description?: string; priority: Priority; dueDate?: Date; dueTime?: Date; completed: boolean; completedAt?: Date; listId?: string; createdAt: Date; updatedAt: Date }): ListInboxTasksResponse {
    return {
      id: task.id,
      title: task.title.value,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      completed: task.completed,
      completedAt: task.completedAt,
      listId: task.listId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}
