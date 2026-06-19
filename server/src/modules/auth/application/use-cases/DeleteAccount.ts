import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'

interface DeleteAccountRequest {
  userId: string
  password: string
  tokenIssuedAt: number // Unix timestamp in seconds from JWT iat claim
}

interface DeleteAccountResponse {
  message: string
}

export class DeleteAccount {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute({ userId, password, tokenIssuedAt }: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    // JWT freshness check: must be < 5 minutes since issuance
    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (nowInSeconds - tokenIssuedAt > 300) {
      throw new AppError(
        'Session too old. Please re-authenticate to delete your account.',
        401,
        'SESSION_TOO_OLD',
      )
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND')
    }

    const isMatch = await Password.compare(password, user.passwordHash)
    if (!isMatch) {
      throw new AppError('Password is incorrect', 401, 'INVALID_PASSWORD')
    }

    await this.userRepository.softDelete(userId)
    await this.refreshTokenRepository.revokeAllByUserId(userId)

    return { message: 'Account deleted successfully' }
  }
}
