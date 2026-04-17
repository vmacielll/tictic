import { z } from 'zod'

const monthYearSchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12, 'Month must be between 1 and 12'),
    year: z.coerce.number().int().min(2000).max(2100, 'Year must be between 2000 and 2100'),
  })

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const CalendarMonthQuerySchema = monthYearSchema

export const CalendarWeekQuerySchema = z.object({
  date: dateSchema,
})

export const CalendarDayQuerySchema = z.object({
  date: dateSchema,
})

export type CalendarMonthQueryInput = z.infer<typeof CalendarMonthQuerySchema>
export type CalendarWeekQueryInput = z.infer<typeof CalendarWeekQuerySchema>
export type CalendarDayQueryInput = z.infer<typeof CalendarDayQuerySchema>