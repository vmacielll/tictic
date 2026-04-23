import { z } from 'zod'

export const CreateListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
})

export const UpdateListSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
})

export const ListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})

export type CreateListInput = z.infer<typeof CreateListSchema>
export type UpdateListInput = z.infer<typeof UpdateListSchema>
export type ListIdInput = z.infer<typeof ListIdSchema>