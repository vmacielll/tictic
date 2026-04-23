import type { FastifyInstance, FastifyReply } from 'fastify'
import { vi } from 'vitest'

export function createMockFastifyInstance(overrides?: {
  jwtSignResult?: string
}): { app: FastifyInstance; reply: FastifyReply } {
  const mockJwt = {
    sign: vi.fn().mockImplementation((payload, options?) => {
      return `mock-token-${payload.sub}-${options?.expiresIn || '15m'}`
    }),
  }

  const mockReply = {
    setCookie: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply

  const mockApp = {
    jwt: mockJwt,
  } as unknown as FastifyInstance

  return { app: mockApp, reply: mockReply }
}
