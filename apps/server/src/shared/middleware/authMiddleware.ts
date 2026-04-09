import { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors/AppError'

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string
  userTimezone: string
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()
    const token = request.user as { sub: string }
    ;(request as AuthenticatedRequest).userId = token.sub
  } catch {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
  }
}
