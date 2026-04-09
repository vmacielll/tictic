import type { FastifyInstance } from 'fastify'
import { vi } from 'vitest'

export function createMockFastifyInstance(overrides?: {
  jwtSignResult?: string
}): FastifyInstance {
  const mockJwt = {
    sign: vi.fn().mockImplementation((payload, options?) => {
      return `mock-token-${payload.sub}-${options?.expiresIn || '15m'}`
    }),
  }

  return {
    jwt: mockJwt,
  } as unknown as FastifyInstance
}
