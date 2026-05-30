import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'

interface UncompleteTaskRequest {
  taskId: string
  userId: string
}

interface UncompleteTaskResponse {
  id: string
  completed: boolean
  completedAt: Date | undefined
  updatedAt: Date
}

export class UncompleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: UncompleteTaskRequest): Promise<UncompleteTaskResponse> {
    const task = await this.taskRepository.findById(request.taskId, request.userId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    ensureOwnership(task, request.userId, 'task')

    task.uncomplete()

    const updated = await this.taskRepository.save(task)

    return {
      id: updated.id,
      completed: updated.completed,
      completedAt: updated.completedAt,
      updatedAt: updated.updatedAt,
    }
  }
}
