import { z } from 'zod'
import { uuidSchema, datetimeString } from '../shared/schemas'

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

export type ListColor = (typeof LIST_COLORS)[number]

export const listSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().optional(),
  userId: z.string().uuid(),
  taskCount: z.number().default(0),
  createdAt: datetimeString.transform((d) => new Date(d)),
})

export type List = z.output<typeof listSchema>

// ── Parsers ──
export function parseList(raw: unknown): List {
  return listSchema.parse(raw)
}

export function parseLists(raw: unknown[]): List[] {
  return raw.map(parseList)
}