import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'
import { toTaskResponse, type TaskResponse } from '../../http/mappers/taskResponse'

interface GetTaskRequest {
  taskId: string
  userId: string
}

export class GetTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetTaskRequest): Promise<TaskResponse> {
    const task = await this.taskRepository.findById(request.taskId, request.userId)

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    ensureOwnership(task, request.userId, 'task')

    return toTaskResponse(task)
  }
}