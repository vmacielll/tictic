import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'
import type { Priority } from '../../domain/types/Priority'
import { toTaskResponse, type TaskResponse } from '../../http/mappers/taskResponse'

interface UpdateTaskRequest {
  taskId: string
  userId: string
  title?: string
  description?: string
  priority?: Priority
  dueDate?: string
  dueTime?: string
  dueTimezone: string
  listId?: string
  completed?: boolean
}

export class UpdateTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: UpdateTaskRequest): Promise<TaskResponse> {
    const task = await this.taskRepository.findById(request.taskId, request.userId)
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND')
    }

    ensureOwnership(task, request.userId, 'task')

    task.update(
      request.title,
      request.description,
      request.priority,
      request.dueDate,
      request.dueTime,
      request.dueTimezone,
      request.listId,
    )

    if (request.completed !== undefined) {
      task.setCompleted(request.completed)
    }

    const saved = await this.taskRepository.save(task)
    return toTaskResponse(saved)
  }
}