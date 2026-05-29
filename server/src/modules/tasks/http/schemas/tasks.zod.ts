import { z } from 'zod'

export const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: PrioritySchema.optional().default('MEDIUM'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  dueTimezone: z.string().optional().nullable(),
  listId: z.string().uuid().optional().nullable(),
})

export const UpdateTaskSchema = CreateTaskSchema.extend({
  completed: z.boolean().optional(),
}).partial()

export const TaskParamsSchema = z.object({
  id: z.string().uuid(),
})

export const PaginationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  size: z.string().transform(Number).default('20'),
})
