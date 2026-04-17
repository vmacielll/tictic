import { AppError } from '@shared/errors/AppError'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import { Password } from '../../domain/value-objects/Password'
import { User } from '../../domain/entities/User'

interface RegisterUserRequest {
  name: string
  email: string
  password: string
}

interface RegisterUserResponse {
  id: string
  name: string
  email: string
}

export class RegisterUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ name, email, password }: RegisterUserRequest): Promise<RegisterUserResponse> {
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS')
    }

    const passwordHash = await Password.hash(password)
    const user = User.create(name, email, passwordHash)

    const created = await this.userRepository.create({
      id: user.id,
      name: user.name,
      email: user.email.toString(),
      passwordHash,
    })

    return {
      id: created.id,
      name: created.name,
      email: created.email,
    }
  }
}
