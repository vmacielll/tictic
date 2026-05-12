import crypto from 'crypto'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'
import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import type { FastifyBaseLogger } from 'fastify'
import { getLogger } from '@shared/utils/logger'

interface LoginUserRequest {
  email: string
  password: string
}

interface LoginUserResponse {
  user: {
    id: string
    name: string
    email: string
  }
  accessToken: string
  refreshToken: string
}

export class LoginUser {
  private logger: FastifyBaseLogger

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtSign: (payload: object, options?: object) => string,
  ) {
    this.logger = getLogger('LoginUser')
  }

  async execute({ email, password }: LoginUserRequest): Promise<LoginUserResponse> {
    const startTime = Date.now()
    const correlationId = crypto.randomUUID()

    this.logger.info({
      action: 'LoginUser.start',
      correlationId,
      email,
    }, 'Login attempt')

    try {
      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        this.logger.warn({
          action: 'LoginUser.invalid_credentials',
          correlationId,
          email,
          reason: 'user_not_found',
        }, 'Login failed - user not found')
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
      }

      const isValidPassword = await Password.compare(password, user.passwordHash)
      if (!isValidPassword) {
        this.logger.warn({
          action: 'LoginUser.invalid_credentials',
          correlationId,
          email,
          reason: 'invalid_password',
        }, 'Login failed - invalid password')
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
      }

      const accessToken = this.jwtSign({ sub: user.id })

      const refreshToken = this.jwtSign(
        { sub: user.id },
        { expiresIn: '7d' },
      )

      // Hash and store refresh token
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await this.refreshTokenRepository.create({
        id: crypto.randomUUID(),
        tokenHash,
        userId: user.id,
        expiresAt,
      })

      const duration = Date.now() - startTime
      this.logger.info({
        action: 'LoginUser.success',
        correlationId,
        userId: user.id,
        duration,
      }, 'Login successful')

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      if (error instanceof AppError) {
        this.logger.warn({
          action: 'LoginUser.error',
          correlationId,
          error: error.message,
          code: error.code,
          duration,
        }, 'Login failed')
      } else {
        this.logger.error({
          action: 'LoginUser.error',
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
        }, 'Login failed')
      }
      throw error
    }
  }
}
