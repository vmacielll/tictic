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

export const PaginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    size: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
}

export const TaskParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
  required: ['id'],
}

export const TaskResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string' },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    dueDate: { type: 'string', format: 'date-time' },
    dueTime: { type: 'string', format: 'date-time' },
    completed: { type: 'boolean' },
    completedAt: { type: 'string', format: 'date-time' },
    listId: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
}

export const TaskListResponseSchema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: TaskResponseSchema,
    },
    total: { type: 'integer' },
    page: { type: 'integer' },
    size: { type: 'integer' },
  },
}

export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' },
  },
}