import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { Priority } from '../../domain/types/Priority'
import { DateTime } from 'luxon'

interface ListTasksByDateRequest {
  userId: string
  date: Date
  timezone: string
}

interface ListTasksByDateResponse {
  id: string
  title: string
  description?: string
  priority: Priority
  dueDate?: Date
  dueTime?: Date
  completed: boolean
  completedAt?: Date
  listId?: string
  createdAt: Date
  updatedAt: Date
}

export class ListTasksByDate {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksByDateRequest): Promise<ListTasksByDateResponse[]> {
    const { userId, date, timezone } = request

    // Convert input date to user's timezone
    const localDate = DateTime.fromJSDate(date, { zone: 'UTC' }).setZone(timezone)
    
    // Get start and end of day in user's timezone
    const startOfDay = localDate.startOf('day').toUTC().toJSDate()
    const endOfDay = localDate.endOf('day').toUTC().toJSDate()

    const tasks = await this.taskRepository.findByUserIdAndDateRange(
      userId,
      startOfDay,
      endOfDay,
    )
    return tasks.map(this.toResponse)
  }

  private toResponse(task: { id: string; title: { value: string }; description?: string; priority: Priority; dueDate?: Date; dueTime?: Date; completed: boolean; completedAt?: Date; listId?: string; createdAt: Date; updatedAt: Date }): ListTasksByDateResponse {
    return {
      id: task.id,
      title: task.title.value,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      completed: task.completed,
      completedAt: task.completedAt,
      listId: task.listId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}
