import type { ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import type { CalendarDay, CalendarTask } from '../../domain/types/CalendarTypes'
import { DateTime } from 'luxon'

interface GetCalendarMonthRequest {
  userId: string
  month: number
  year: number
  timezone: string
}

interface GetCalendarMonthResponse {
  days: CalendarDay[]
}

export class GetCalendarMonth {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetCalendarMonthRequest): Promise<GetCalendarMonthResponse> {
    const { userId, month, year, timezone } = request

    // Create date in user's timezone to calculate month boundaries
    const localDate = DateTime.fromObject({ year, month, day: 1, hour: 12 }, { zone: timezone })
    const startDate = localDate.startOf('month').toFormat('yyyy-MM-dd')
    const endDate = localDate.endOf('month').toFormat('yyyy-MM-dd')

    const tasks = await this.taskRepository.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    )

    const tasksWithDate = tasks.filter((t) => t.dueDate !== undefined && t.dueDate !== null)

    const daysMap = new Map<string, CalendarTask[]>()

    // Create entries for each day of the month
    const daysInMonth = localDate.daysInMonth || 30
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      daysMap.set(dateStr, [])
    }

    // Assign tasks to their respective days
    for (const task of tasksWithDate) {
      const dateStr = task.dueDate!

      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, [])
      }

      daysMap.get(dateStr)!.push({
        id: task.id,
        title: task.title.value,
        priority: task.priority,
        completed: task.completed,
        dueDate: task.dueDate!,
      })
    }

    const days: CalendarDay[] = Array.from(daysMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({ date, tasks }))

    return { days }
  }
}