import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChangePassword } from './ChangePassword'
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

describe('ChangePassword Use Case', () => {
  let _changePassword: ChangePassword
  const mockRepository = createMockUserRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    _changePassword = new ChangePassword(mockRepository)
  })

  it('should change password successfully', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'oldHashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    mockRepository.findById = vi.fn().mockResolvedValue(mockUser)
    vi.mocked(Password.compare).mockResolvedValue(true)
    vi.mocked(Password.hash).mockResolvedValue('newHashedPassword')

    const result = await _changePassword.execute({
      userId: 'user-id',
      currentPassword: 'correctPassword',
      newPassword: 'newPassword123',
    })

    expect(result).toEqual({ message: 'Password changed successfully' })
    expect(Password.compare).toHaveBeenCalledWith('correctPassword', 'oldHashedPassword')
    expect(Password.hash).toHaveBeenCalledWith('newPassword123')
    expect(mockRepository.updatePasswordAndRevokeTokens).toHaveBeenCalledWith('user-id', 'newHashedPassword')
  })

  it('should throw NOT_FOUND if user does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(
      _changePassword.execute({
        userId: 'non-existent',
        currentPassword: 'anyPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _changePassword.execute({
        userId: 'non-existent',
        currentPassword: 'anyPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow('User not found')
  })

  it('should throw INVALID_PASSWORD if current password is wrong', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'oldHashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    mockRepository.findById = vi.fn().mockResolvedValue(mockUser)
    vi.mocked(Password.compare).mockResolvedValue(false)

    await expect(
      _changePassword.execute({
        userId: 'user-id',
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _changePassword.execute({
        userId: 'user-id',
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow('Current password is incorrect')
  })
})
