import type { ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import type { Priority } from '../../../tasks/domain/types/Priority'
import { DateTime } from 'luxon'

interface GetCalendarWeekRequest {
  userId: string
  date: Date
  timezone: string
}

interface CalendarDay {
  date: string // YYYY-MM-DD in user's timezone
  tasks: CalendarTask[]
}

interface CalendarTask {
  id: string
  title: string
  priority: Priority
  completed: boolean
  dueDate: string // ISO 8601 UTC timestamp
}

interface GetCalendarWeekResponse {
  days: CalendarDay[]
}

export class GetCalendarWeek {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetCalendarWeekRequest): Promise<GetCalendarWeekResponse> {
    const { userId, date, timezone } = request

    // Convert input date to user's timezone
    const localDate = DateTime.fromJSDate(date, { zone: 'UTC' }).setZone(timezone)

    // Get start and end of week in user's timezone
    const startOfWeek = localDate.startOf('week') // Monday
    const endOfWeek = localDate.endOf('week') // Sunday

    const startDate = startOfWeek.toUTC().toJSDate()
    const endDate = endOfWeek.toUTC().toJSDate()

    const tasks = await this.taskRepository.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    )

    const tasksWithDate = tasks.filter((t) => t.dueDate !== undefined && t.dueDate !== null)

    // Create entries for each day of the week
    const days: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      const dayDate = startOfWeek.plus({ days: i })
      days.push({
        date: dayDate.toFormat('yyyy-MM-dd'),
        tasks: [],
      })
    }

    // Assign tasks to their respective days
    for (const task of tasksWithDate) {
      const taskDate = DateTime.fromJSDate(task.dueDate!, { zone: 'UTC' }).setZone(timezone)
      const dateStr = taskDate.toFormat('yyyy-MM-dd')
      const day = days.find((d) => d.date === dateStr)
      if (day) {
        day.tasks.push({
          id: task.id,
          title: task.title.value,
          priority: task.priority,
          completed: task.completed,
          dueDate: task.dueDate!.toISOString(), // Full ISO UTC timestamp
        })
      }
    }

    return { days }
  }
}
