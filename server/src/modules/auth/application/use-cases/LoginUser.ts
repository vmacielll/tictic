import crypto from 'crypto'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'
import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'

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
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtSign: (payload: object, options?: object) => string,
  ) {}

  async execute({ email, password }: LoginUserRequest): Promise<LoginUserResponse> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const isValidPassword = await Password.compare(password, user.passwordHash)
    if (!isValidPassword) {
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

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    }
  }
}
