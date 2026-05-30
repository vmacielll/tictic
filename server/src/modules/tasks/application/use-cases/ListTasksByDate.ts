import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { toTaskResponse, type TaskResponse } from '../../http/mappers/taskResponse'

interface ListTasksByDateRequest {
  userId: string
  date: string
  timezone: string
}

export class ListTasksByDate {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksByDateRequest): Promise<TaskResponse[]> {
    const { userId, date } = request

    const tasks = await this.taskRepository.findByDueDate(userId, date)
    return tasks.map(toTaskResponse)
  }
}