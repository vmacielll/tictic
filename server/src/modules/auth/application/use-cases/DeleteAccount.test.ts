import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeleteAccount } from './DeleteAccount'
import { createMockUserRepository } from '../../__mocks__/MockUserRepository'
import { Password } from '../../domain/value-objects/Password'
import { AppError } from '@shared/errors/AppError'
import { User } from '../../domain/entities/User'

vi.mock('../../domain/value-objects/Password', () => ({
  Password: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

describe('DeleteAccount Use Case', () => {
  let _deleteAccount: DeleteAccount
  const mockUserRepository = createMockUserRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    _deleteAccount = new DeleteAccount(mockUserRepository)
  })

  it('should delete account successfully', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser)
    vi.mocked(Password.compare).mockResolvedValue(true)

    const now = Math.floor(Date.now() / 1000)
    const result = await _deleteAccount.execute({
      userId: 'user-id',
      password: 'correctPassword',
      tokenIssuedAt: now - 60,
    })

    expect(result).toEqual({ message: 'Account deleted successfully' })
    expect(Password.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword')
    expect(mockUserRepository.softDeleteAndRevokeTokens).toHaveBeenCalledWith('user-id')
  })

  it('should throw SESSION_TOO_OLD if JWT is older than 5 minutes', async () => {
    const now = Math.floor(Date.now() / 1000)

    await expect(
      _deleteAccount.execute({
        userId: 'user-id',
        password: 'anyPassword',
        tokenIssuedAt: now - 301,
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _deleteAccount.execute({
        userId: 'user-id',
        password: 'anyPassword',
        tokenIssuedAt: now - 301,
      }),
    ).rejects.toThrow('Session too old')
  })

  it('should throw NOT_FOUND if user does not exist', async () => {
    mockUserRepository.findById = vi.fn().mockResolvedValue(null)

    const now = Math.floor(Date.now() / 1000)

    await expect(
      _deleteAccount.execute({
        userId: 'non-existent',
        password: 'anyPassword',
        tokenIssuedAt: now - 60,
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _deleteAccount.execute({
        userId: 'non-existent',
        password: 'anyPassword',
        tokenIssuedAt: now - 60,
      }),
    ).rejects.toThrow('User not found')
  })

  it('should throw INVALID_PASSWORD if password is wrong', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    mockUserRepository.findById = vi.fn().mockResolvedValue(mockUser)
    vi.mocked(Password.compare).mockResolvedValue(false)

    const now = Math.floor(Date.now() / 1000)

    await expect(
      _deleteAccount.execute({
        userId: 'user-id',
        password: 'wrongPassword',
        tokenIssuedAt: now - 60,
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _deleteAccount.execute({
        userId: 'user-id',
        password: 'wrongPassword',
        tokenIssuedAt: now - 60,
      }),
    ).rejects.toThrow('Password is incorrect')
  })
})
