import type { FastifyInstance } from 'fastify'
import { AppError } from '../../../../shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'

interface LoginUserRequest {
  email: string
  password: string
}

interface LoginUserResponse {
  accessToken: string
  refreshToken: string
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

  async execute({ email, password }: LoginUserRequest): Promise<LoginUserResponse> {
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }
  }
}
