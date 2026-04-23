import { z } from 'zod'
import { uuidSchema, datetimeString, dateIsoString, prioritySchema } from '../shared/schemas'

// ── Tarefa resumida — usada nas views month/week ──
export const calendarSummaryTaskSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  priority: prioritySchema,
  completed: z.boolean(),
  dueDate: datetimeString.transform((d) => new Date(d)),
})

export type CalendarSummaryTask = z.output<typeof calendarSummaryTaskSchema>

// ── Tarefa completa — usada na view day ──
export const calendarDetailTaskSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string().optional(),
  priority: prioritySchema,
  completed: z.boolean(),
  dueDate: datetimeString.transform((d) => new Date(d)),
  dueTime: datetimeString.optional().transform((d) => (d ? new Date(d) : undefined)),
  listId: uuidSchema.optional(),
})

export type CalendarDetailTask = z.output<typeof calendarDetailTaskSchema>

// ── Dia do calendário (month/week) — tasks resumidas ──
export const calendarDaySchema = z.object({
  date: dateIsoString,
  tasks: z.array(calendarSummaryTaskSchema),
})

export type CalendarDay = z.output<typeof calendarDaySchema>

// ── Dia detalhado (day view) — tasks completas ──
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

// ── Utilitários ──
export function getTaskCountForDate(days: CalendarDay[], date: Date): number {
  const key = date.toISOString().slice(0, 10)
  return days.find((d) => d.date === key)?.tasks.length ?? 0
}
