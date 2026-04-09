import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RegisterUser } from './RegisterUser'
import { createMockUserRepository } from '../../__mocks__/MockUserRepository'
import { AppError } from '../../../../shared/errors/AppError'
import type { IUser } from '../../domain/repositories/IUserRepository'

describe('RegisterUser Use Case', () => {
  let registerUser: RegisterUser
  const mockRepository = createMockUserRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    registerUser = new RegisterUser(mockRepository)
  })

  it('should register a new user successfully', async () => {
    const mockCreatedUser: IUser = {
      id: 'new-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({ createResult: mockCreatedUser })
    const useCase = new RegisterUser(mockRepo)

    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123',
    })

    expect(result).toEqual({
      id: 'new-user-id',
      name: 'John Doe',
      email: 'john@example.com',
    })
    expect(mockRepo.create).toHaveBeenCalledTimes(1)
  })

  it('should throw AppError when email is already registered', async () => {
    const existingUser: IUser = {
      id: 'existing-user-id',
      name: 'Existing User',
      email: 'existing@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const useCase = new RegisterUser(mockRepo)

    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'securePassword123',
      })
    ).rejects.toThrow(AppError)

    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'securePassword123',
      })
    ).rejects.toThrow('Email already registered')
  })

  it('should throw AppError with correct status code for duplicate email', async () => {
    const existingUser: IUser = {
      id: 'existing-user-id',
      name: 'Existing User',
      email: 'existing@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const useCase = new RegisterUser(mockRepo)

    try {
      await useCase.execute({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'securePassword123',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(409)
      expect((error as AppError).code).toBe('EMAIL_ALREADY_EXISTS')
    }
  })

  it('should call create with hashed password', async () => {
    const mockRepo = createMockUserRepository()
    const useCase = new RegisterUser(mockRepo)

    await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123',
    })

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: expect.any(String),
      })
    )
  })

  it('should call create with generated id', async () => {
    const mockRepo = createMockUserRepository()
    const useCase = new RegisterUser(mockRepo)

    await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123',
    })

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ),
      })
    )
  })
})
