import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '../../../../shared/errors/AppError'
import type { Priority } from '../../domain/types/Priority'

interface UpdateTaskRequest {
  taskId: string
  userId: string
  title?: string
  description?: string
  priority?: Priority
  dueDate?: Date
  dueTime?: Date
  listId?: string
}

interface UpdateTaskResponse {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: Date
  dueTime?: Date
  completed: boolean
  listId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export class UpdateTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: UpdateTaskRequest): Promise<UpdateTaskResponse> {
    const task = await this.taskRepository.findById(request.taskId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    if (task.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    task.update(
      request.title,
      request.description,
      request.priority,
      request.dueDate,
      request.dueTime,
      request.listId,
    )

    const updated = await this.taskRepository.save(task)

    return this.toResponse(updated)
  }

  private toResponse(task: { id: string; title: { value: string }; description?: string; priority: Priority; dueDate?: Date; dueTime?: Date; completed: boolean; listId?: string; userId: string; createdAt: Date; updatedAt: Date }): UpdateTaskResponse {
    return {
      id: task.id,
      title: task.title.value,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      completed: task.completed,
      listId: task.listId,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}
