import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'

interface ChangePasswordRequest {
  userId: string
  currentPassword: string
  newPassword: string
}

interface ChangePasswordResponse {
  message: string
}

export class ChangePassword {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId, currentPassword, newPassword }: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND')
    }

    const isMatch = await Password.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD')
    }

    const newHash = await Password.hash(newPassword)
    await this.userRepository.updatePasswordAndRevokeTokens(userId, newHash)

    return { message: 'Password changed successfully' }
  }
}
