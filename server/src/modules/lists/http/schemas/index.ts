import { z } from 'zod'

export const LIST_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#2563eb',
  '#65a30d',
  '#9333ea',
] as const

export const listColorSchema = z
  .string()
  .refine((val) => (LIST_COLORS as readonly string[]).includes(val), {
    message: 'Color must be one of the allowed palette values',
  })
  .optional()

export const CreateListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: listColorSchema,
})

export const UpdateListSchema = z.object({
  name: z.string().min(1).optional(),
  color: listColorSchema,
})

export const ListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})

export const ListTasksQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  size: z.string().transform(Number).default('20'),
})

export type CreateListInput = z.infer<typeof CreateListSchema>
export type UpdateListInput = z.infer<typeof UpdateListSchema>
export type ListIdInput = z.infer<typeof ListIdSchema>