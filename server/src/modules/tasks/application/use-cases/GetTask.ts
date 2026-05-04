import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import type { Priority } from '../../domain/types/Priority'

interface GetTaskRequest {
  taskId: string
  userId: string
}

interface GetTaskResponse {
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

export class GetTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetTaskRequest): Promise<GetTaskResponse> {
    const task = await this.taskRepository.findById(request.taskId, request.userId)

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    if (task.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    return this.toResponse(task)
  }

  private toResponse(task: {
    id: string
    title: { value: string }
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
  }): GetTaskResponse {
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
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}