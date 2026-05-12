import crypto from 'crypto'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'
import { AppError } from '@shared/errors/AppError'
import type { FastifyBaseLogger } from 'fastify'
import { getLogger } from '@shared/utils/logger'

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export class RefreshToken {
  private logger: FastifyBaseLogger

  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtSign: (payload: object, options?: object) => string,
    private readonly jwtVerify: (token: string) => { sub: string },
    private readonly prisma: any, // PrismaClient for transactions
  ) {
    this.logger = getLogger('RefreshToken')
  }

  async execute(refreshToken: string): Promise<RefreshTokenResponse> {
    const startTime = Date.now()
    const correlationId = crypto.randomUUID()

    this.logger.info({
      action: 'RefreshToken.start',
      correlationId,
      tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex').substring(0, 16),
    }, 'Refreshing token')

    try {
      // Verify token signature
      const decoded = this.jwtVerify(refreshToken)

      // Check if token exists in database and is not revoked
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash)

      if (!storedToken || storedToken.revoked) {
        this.logger.warn({
          action: 'RefreshToken.invalid',
          correlationId,
          reason: !storedToken ? 'token_not_found' : 'token_revoked',
        }, 'Invalid refresh token')
        throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED')
      }

      if (new Date() > storedToken.expiresAt) {
        await this.refreshTokenRepository.revoke(tokenHash)
        this.logger.warn({
          action: 'RefreshToken.expired',
          correlationId,
        }, 'Refresh token expired')
        throw new AppError('Refresh token expired', 401, 'UNAUTHORIZED')
      }

      // Check for token reuse (if token was already marked as used, it's a reuse attack)
      if (storedToken.usedAt) {
        // Reuse detected - revoke all sessions for this user
        await this.refreshTokenRepository.revokeAllByUserId(storedToken.userId)
        this.logger.warn({
          action: 'RefreshToken.reuse_detected',
          correlationId,
          userId: storedToken.userId,
        }, 'Token reuse detected - all sessions revoked')
        throw new AppError('Token reuse detected', 401, 'REUSE_DETECTED')
      }

      // Mark token as used before rotation (for reuse detection)
      await this.refreshTokenRepository.markAsUsed(tokenHash)

      // Generate new tokens
      const newAccessToken = this.jwtSign({ sub: decoded.sub })
      const newRefreshToken = this.jwtSign({ sub: decoded.sub }, { expiresIn: '7d' })

      // Atomic rotation: revoke old token and create new one in a transaction
      const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await this.prisma.$transaction([
        this.prisma.refreshToken.update({
          where: { tokenHash },
          data: { revoked: true },
        }),
        this.prisma.refreshToken.create({
          data: {
            id: crypto.randomUUID(),
            tokenHash: newTokenHash,
            userId: storedToken.userId,
            expiresAt: newExpiresAt,
            revoked: false,
          },
        }),
      ])

      const duration = Date.now() - startTime
      this.logger.info({
        action: 'RefreshToken.success',
        correlationId,
        userId: storedToken.userId,
        duration,
      }, 'Token refreshed successfully')

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      if (error instanceof AppError) {
        this.logger.warn({
          action: 'RefreshToken.error',
          correlationId,
          error: error.message,
          code: error.code,
          duration,
        }, 'Token refresh failed')
      } else {
        this.logger.error({
          action: 'RefreshToken.error',
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
        }, 'Token refresh failed')
      }
      throw error
    }
  }
}
