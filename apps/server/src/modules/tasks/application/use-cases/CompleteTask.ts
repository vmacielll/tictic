import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '../../../../shared/errors/AppError'

interface CompleteTaskRequest {
  taskId: string
  userId: string
}

interface CompleteTaskResponse {
  id: string
  completed: boolean
  completedAt?: Date
  updatedAt: Date
}

export class CompleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: CompleteTaskRequest): Promise<CompleteTaskResponse> {
    const task = await this.taskRepository.findById(request.taskId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    if (task.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    task.complete()

    const updated = await this.taskRepository.save(task)

    return {
      id: updated.id,
      completed: updated.completed,
      completedAt: updated.completedAt,
      updatedAt: updated.updatedAt,
    }
  }
}
