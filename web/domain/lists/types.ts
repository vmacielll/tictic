import { z } from 'zod'
import { uuidSchema, datetimeString } from '../shared/schemas'

export const listSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  color: z.string().optional(),
  userId: uuidSchema,
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
