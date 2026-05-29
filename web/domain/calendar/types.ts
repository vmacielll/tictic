import { z } from 'zod'
import { uuidSchema, datetimeString, dateIsoString, timeString, prioritySchema } from '../shared/schemas'

// ── Summary task — used in month/week views ──
export const calendarSummaryTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  priority: prioritySchema,
  completed: z.boolean(),
  dueDate: dateIsoString.transform((d) => new Date(d + 'T00:00:00.000Z')),
})

export type CalendarSummaryTask = z.output<typeof calendarSummaryTaskSchema>

// ── Detail task — used in day view ──
export const calendarDetailTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  priority: prioritySchema,
  completed: z.boolean(),
  dueDate: dateIsoString.transform((d) => new Date(d + 'T00:00:00.000Z')),
  dueTime: timeString.optional(),
  listId: uuidSchema.optional(),
})

export type CalendarDetailTask = z.output<typeof calendarDetailTaskSchema>

// ── Calendar day (month/week) — summary tasks ──
export const calendarDaySchema = z.object({
  date: dateIsoString,
  tasks: z.array(calendarSummaryTaskSchema),
})

export type CalendarDay = z.output<typeof calendarDaySchema>

// ── Detail day (day view) — full tasks ──
export const calendarDayDetailSchema = z.object({
  date: dateIsoString,
  tasks: z.array(calendarDetailTaskSchema),
})

export type CalendarDayDetail = z.output<typeof calendarDayDetailSchema>

// ── Parsers ──
export function parseCalendarDays(days: unknown[]): CalendarDay[] {
  return z.array(calendarDaySchema).parse(days)
}

export function parseCalendarDayDetail(raw: unknown): CalendarDayDetail {
  return calendarDayDetailSchema.parse(raw)
}

// ── Utilities ──
export function getTaskCountForDate(days: CalendarDay[], date: Date): number {
  const key = date.toISOString().slice(0, 10)
  return days.find((d) => d.date === key)?.tasks.length ?? 0
}
