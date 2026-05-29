import type { ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import type { CalendarTask } from '../../domain/types/CalendarTypes'
import { DateTime } from 'luxon'

interface GetCalendarDayRequest {
  userId: string
  date: string
  timezone: string
}

interface GetCalendarDayResponse {
  date: string // YYYY-MM-DD in user's timezone
  tasks: CalendarTask[]
}

export class GetCalendarDay {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetCalendarDayRequest): Promise<GetCalendarDayResponse> {
    const { userId, date, timezone } = request

    // Convert input date to user's timezone
    const localDate = DateTime.fromISO(date, { zone: timezone })

    const tasks = await this.taskRepository.findByDueDate(userId, date)

    const tasksWithDate = tasks.filter((t) => t.dueDate !== undefined && t.dueDate !== null)

    return {
      date: localDate.toFormat('yyyy-MM-dd'),
      tasks: tasksWithDate.map((task) => ({
        id: task.id,
        title: task.title.value,
        description: task.description,
        priority: task.priority,
        completed: task.completed,
        dueDate: task.dueDate!,
        dueTime: task.dueTime,
        listId: task.listId,
      })),
    }
  }
}