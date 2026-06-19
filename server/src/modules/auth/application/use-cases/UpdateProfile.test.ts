import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateProfile } from './UpdateProfile'
import { createMockUserRepository } from '../../__mocks__/MockUserRepository'
import { User } from '../../domain/entities/User'
import { AppError } from '@shared/errors/AppError'

describe('UpdateProfile Use Case', () => {
  let _updateProfile: UpdateProfile
  const mockRepository = createMockUserRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    _updateProfile = new UpdateProfile(mockRepository)
  })

  it('should update user name successfully and return updated profile', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Original Name',
      email: 'user@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    mockRepository.findById = vi.fn().mockResolvedValue(mockUser)
    mockRepository.save = vi.fn().mockImplementation((user: User) => Promise.resolve(user))

    const result = await _updateProfile.execute({
      userId: 'user-id',
      name: 'New Name',
    })

    expect(result).toEqual({
      id: 'user-id',
      name: 'New Name',
      email: 'user@example.com',
    })
    expect(mockRepository.save).toHaveBeenCalledTimes(1)
  })

  it('should throw NOT_FOUND if user does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(
      _updateProfile.execute({
        userId: 'non-existent',
        name: 'New Name',
      }),
    ).rejects.toThrow(AppError)

    await expect(
      _updateProfile.execute({
        userId: 'non-existent',
        name: 'New Name',
      }),
    ).rejects.toThrow('User not found')
  })

  it('should call user.changeName() and userRepository.save()', async () => {
    const mockUser = User.reconstitute({
      id: 'user-id',
      name: 'Original Name',
      email: 'user@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    const changeNameSpy = vi.spyOn(mockUser, 'changeName')
    mockRepository.findById = vi.fn().mockResolvedValue(mockUser)
    mockRepository.save = vi.fn().mockImplementation((user: User) => Promise.resolve(user))

    await _updateProfile.execute({
      userId: 'user-id',
      name: 'Updated Name',
    })

    expect(changeNameSpy).toHaveBeenCalledWith('Updated Name')
    expect(mockRepository.save).toHaveBeenCalledWith(mockUser)
  })
})
