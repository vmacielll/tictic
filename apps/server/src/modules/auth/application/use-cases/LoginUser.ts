import type { FastifyInstance, FastifyReply } from 'fastify'
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
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly app: FastifyInstance,
  ) {}

  async execute({ email, password }: LoginUserRequest, reply: FastifyReply): Promise<LoginUserResponse> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const isValidPassword = await Password.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const accessToken = this.app.jwt.sign({ sub: user.id })

    const refreshToken = this.app.jwt.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    )

    reply.setCookie('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
    })

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }
  }
}
