import type { ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import type { Priority } from '../../../tasks/domain/types/Priority'
import { DateTime } from 'luxon'

interface GetCalendarDayRequest {
  userId: string
  date: Date
  timezone: string
}

interface CalendarTask {
  id: string
  title: string
  description?: string
  priority: Priority
  completed: boolean
  dueDate: string // ISO 8601 UTC timestamp
  dueTime?: string // ISO 8601 UTC timestamp
  listId?: string
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
    const localDate = DateTime.fromJSDate(date, { zone: 'UTC' }).setZone(timezone)

    // Get start and end of day in user's timezone
    const startDate = localDate.startOf('day').toUTC().toJSDate()
    const endDate = localDate.endOf('day').toUTC().toJSDate()

    const tasks = await this.taskRepository.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    )

    const tasksWithDate = tasks.filter((t) => t.dueDate !== undefined && t.dueDate !== null)

    return {
      date: localDate.toFormat('yyyy-MM-dd'),
      tasks: tasksWithDate.map((task) => ({
        id: task.id,
        title: task.title.value,
        description: task.description,
        priority: task.priority,
        completed: task.completed,
        dueDate: task.dueDate!.toISOString(), // Full ISO UTC timestamp
        dueTime: task.dueTime?.toISOString(), // Full ISO UTC timestamp
        listId: task.listId,
      })),
    }
  }
}
