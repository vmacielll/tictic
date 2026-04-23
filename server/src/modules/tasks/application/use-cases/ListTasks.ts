import type { ITaskRepository, PaginationParams } from '../../domain/repositories/ITaskRepository'
import type { Priority } from '../../domain/types/Priority'

interface ListTasksRequest {
  userId: string
  pagination?: PaginationParams
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

export interface ListTasksOutput {
  items: ListTasksResponse[]
  meta: {
    page: number
    size: number
    totalCount: number
  }
}

export class ListTasks {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksRequest): Promise<ListTasksOutput> {
    const { userId, pagination } = request
    const page = pagination?.skip ? Math.floor(pagination.skip / (pagination.take || 20)) + 1 : 1
    const size = pagination?.take || 20

    const [tasks, totalCount] = await Promise.all([
      this.taskRepository.findByUserId(userId, pagination),
      this.taskRepository.countByUserId(userId),
    ])

    return {
      items: tasks.map(this.toResponse),
      meta: { page, size, totalCount },
    }
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
