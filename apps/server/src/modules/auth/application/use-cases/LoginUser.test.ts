import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoginUser } from './LoginUser'
import { createMockUserRepository } from '../../__mocks__/MockUserRepository'
import { createMockFastifyInstance } from '../../__mocks__/MockFastifyInstance'
import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUser } from '../../domain/repositories/IUserRepository'

describe('LoginUser Use Case', () => {
  const mockRepository = createMockUserRepository()
  const mockApp = createMockFastifyInstance()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login successfully with correct credentials', async () => {
    const passwordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    const result = await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(result).toEqual({
      accessToken: 'mock-token-user-123-15m',
      refreshToken: 'mock-token-user-123-7d',
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      },
    })
  })

  it('should throw AppError when user not found', async () => {
    const mockRepo = createMockUserRepository({
      findByEmailResult: null,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    await expect(
      useCase.execute({
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      })
    ).rejects.toThrow(AppError)

    await expect(
      useCase.execute({
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      })
    ).rejects.toThrow('Invalid credentials')
  })

  it('should throw AppError with status 401 when user not found', async () => {
    const mockRepo = createMockUserRepository({
      findByEmailResult: null,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    try {
      await useCase.execute({
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(401)
      expect((error as AppError).code).toBe('INVALID_CREDENTIALS')
    }
  })

  it('should throw AppError when password is incorrect', async () => {
    const correctPasswordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: correctPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    await expect(
      useCase.execute({
        email: 'john@example.com',
        password: 'wrongPassword',
      })
    ).rejects.toThrow(AppError)

    await expect(
      useCase.execute({
        email: 'john@example.com',
        password: 'wrongPassword',
      })
    ).rejects.toThrow('Invalid credentials')
  })

  it('should throw AppError with status 401 when password is incorrect', async () => {
    const correctPasswordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: correctPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    try {
      await useCase.execute({
        email: 'john@example.com',
        password: 'wrongPassword',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(401)
      expect((error as AppError).code).toBe('INVALID_CREDENTIALS')
    }
  })

  it('should call jwt.sign with correct payload for access token', async () => {
    const passwordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(mockAppInstance.jwt.sign).toHaveBeenCalledWith({ sub: 'user-123' })
  })

  it('should call jwt.sign with 7d expiry for refresh token', async () => {
    const passwordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(mockAppInstance.jwt.sign).toHaveBeenCalledWith(
      { sub: 'user-123' },
      { expiresIn: '7d' }
    )
  })

  it('should handle case-insensitive email lookup', async () => {
    const passwordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const mockAppInstance = createMockFastifyInstance()
    const useCase = new LoginUser(mockRepo, mockAppInstance)

    const result = await useCase.execute({
      email: 'JOHN@EXAMPLE.COM',
      password: 'correctPassword',
    })

    expect(result.user.email).toBe('john@example.com')
  })
})
