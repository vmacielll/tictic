import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { Priority } from '../../domain/types/Priority'

interface ListTasksRequest {
  userId: string
}

interface ListTasksResponse {
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

export class ListTasks {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksRequest): Promise<ListTasksResponse[]> {
    const tasks = await this.taskRepository.findByUserId(request.userId)
    return tasks.map(this.toResponse)
  }

  private toResponse(task: { id: string; title: { value: string }; description?: string; priority: Priority; dueDate?: Date; dueTime?: Date; completed: boolean; completedAt?: Date; listId?: string; createdAt: Date; updatedAt: Date }): ListTasksResponse {
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
