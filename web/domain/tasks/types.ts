import { z } from 'zod'
import { uuidSchema, datetimeString, dateIsoString, timeString, timezoneSchema, prioritySchema } from '../shared/schemas'

// ── Schema que valida E converte o que vem do servidor ──
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  priority: prioritySchema,
  dueDate: dateIsoString.optional().transform((d) => d ? new Date(d + 'T00:00:00.000Z') : undefined),
  dueTime: timeString.optional(),
  dueTimezone: timezoneSchema.optional(),
  completed: z.boolean(),
  completedAt: datetimeString.optional().transform((d) => d ? new Date(d) : undefined),
  listId: uuidSchema.optional(),
  userId: z.string().uuid(),
  createdAt: datetimeString.transform((d) => d ? new Date(d) : new Date()),
  updatedAt: datetimeString.transform((d) => d ? new Date(d) : new Date()),
})

export type TaskResponse = z.input<typeof taskSchema>
export type Task = z.output<typeof taskSchema>

// ── Parsers — ponto único de validação na borda ──
export function parseTask(raw: unknown): Task {
  return taskSchema.parse(raw)
}

export function parseTasks(raw: unknown[]): Task[] {
  return raw.map(parseTask)
}

// ── Input schemas para criação/atualização ──
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: dateIsoString.optional(),
  dueTime: timeString.optional(),
  listId: uuidSchema.optional(),
})

export type CreateTaskInput = z.output<typeof createTaskSchema>

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: dateIsoString.optional(),
  dueTime: timeString.optional(),
  listId: uuidSchema.optional(),
})

export type UpdateTaskInput = z.output<typeof updateTaskSchema>

// ── "Métodos" como funções puras ──

export function isInbox(task: Task): boolean {
  return task.dueDate === undefined
}

export function isDueToday(task: Task, reference: Date = new Date()): boolean {
  if (!task.dueDate) return false
  return task.dueDate.toDateString() === reference.toDateString()
}

export function isOverdue(task: Task, reference: Date = new Date()): boolean {
  if (!task.dueDate || task.completed) return false
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  const dueDay = new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate())
  return dueDay < today
}

export function isCompleted(task: Task): boolean {
  return task.completed
}
