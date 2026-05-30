import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'

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
    const task = await this.taskRepository.findById(request.taskId, request.userId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    ensureOwnership(task, request.userId, 'task')

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
