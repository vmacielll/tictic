import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'

interface DeleteTaskRequest {
  taskId: string
  userId: string
}

export class DeleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: DeleteTaskRequest): Promise<void> {
    const task = await this.taskRepository.findById(request.taskId, request.userId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    ensureOwnership(task, request.userId, 'task')

    await this.taskRepository.delete(request.taskId, request.userId)
  }
}
