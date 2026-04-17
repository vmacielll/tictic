import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'

interface DeleteTaskRequest {
  taskId: string
  userId: string
}

export class DeleteTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: DeleteTaskRequest): Promise<void> {
    const task = await this.taskRepository.findById(request.taskId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    if (task.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    await this.taskRepository.delete(request.taskId)
  }
}
