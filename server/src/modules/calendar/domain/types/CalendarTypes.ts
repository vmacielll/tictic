import { Priority } from '../../../tasks/domain/types/Priority'

export interface CalendarTask {
  id: string
  title: string
  description?: string
  priority: Priority
  completed: boolean
  dueDate: string // YYYY-MM-DD
  dueTime?: string // HH:mm:ss
  listId?: string
}

export interface CalendarDay {
  date: string // YYYY-MM-DD
  tasks: CalendarTask[]
}

export interface CalendarWeek {
  weekNumber: number
  year: number
  days: CalendarDay[]
}

export interface CalendarMonth {
  month: number
  year: number
  days: CalendarDay[]
}
