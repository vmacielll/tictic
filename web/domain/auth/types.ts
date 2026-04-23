import { z } from 'zod'
import { uuidSchema, datetimeString } from '../shared/schemas'

export const userSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string().email(),
})

export type User = z.output<typeof userSchema>

export const authResponseSchema = z.object({
  user: userSchema,
})

export type AuthResponse = z.output<typeof authResponseSchema>

// ── Parsers ──
export function parseUser(raw: unknown): User {
  return userSchema.parse(raw)
}

export function parseAuthResponse(raw: unknown): AuthResponse {
  return authResponseSchema.parse(raw)
}
