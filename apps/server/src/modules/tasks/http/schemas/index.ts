import { z } from 'zod'

const isoDateSchema = z.string().refine((v) => !v || !isNaN(Date.parse(v)), {
  message: 'Invalid ISO date',
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
})

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: isoDateSchema.optional(),
  dueTime: isoDateSchema.optional(),
  listId: z.string().uuid().optional(),
})

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: isoDateSchema.optional(),
  dueTime: isoDateSchema.optional(),
  listId: z.string().uuid().optional(),
})

export const TaskIdSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
})

export type PaginationInput = z.infer<typeof PaginationSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type TaskIdInput = z.infer<typeof TaskIdSchema>