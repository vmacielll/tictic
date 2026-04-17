import { z } from 'zod'

export const StartPomodoroSchema = z.object({
  duration: z.coerce.number().int().positive('Duration must be a positive integer'),
  taskId: z.string().uuid().optional(),
})

export const CompletePomodoroSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
})

export const CancelPomodoroSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
})

export type StartPomodoroInput = z.infer<typeof StartPomodoroSchema>
export type CompletePomodoroInput = z.infer<typeof CompletePomodoroSchema>
export type CancelPomodoroInput = z.infer<typeof CancelPomodoroSchema>