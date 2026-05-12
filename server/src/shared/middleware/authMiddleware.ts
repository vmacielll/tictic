import { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors/AppError'

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string
  userTimezone: string
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // CSRF protection: check Origin header
    const origin = request.headers.origin
    if (origin) {
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
      if (origin !== allowedOrigin) {
        throw new AppError('Forbidden', 403, 'CSRF')
      }
    }

    await request.jwtVerify()
    const token = request.user as { sub: string }
    ;(request as unknown as AuthenticatedRequest).userId = token.sub
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
  }
}
