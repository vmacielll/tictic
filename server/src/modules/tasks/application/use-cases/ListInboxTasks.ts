import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { toTaskResponse, type TaskResponse } from '../../http/mappers/taskResponse'

interface ListInboxTasksRequest {
  userId: string
}

export class ListInboxTasks {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListInboxTasksRequest): Promise<TaskResponse[]> {
    const tasks = await this.taskRepository.findInboxByUserId(request.userId)
    return tasks.map(toTaskResponse)
  }
}