import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoginUser } from './LoginUser'
import { createMockUserRepository } from '../../__mocks__/MockUserRepository'
import { AppError } from '@shared/errors/AppError'
import { Password } from '../../domain/value-objects/Password'
import type { IUser } from '../../domain/repositories/IUserRepository'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'

describe('LoginUser Use Case', () => {
  const mockRepository = createMockUserRepository()
  const mockRefreshTokenRepository = {
    create: vi.fn().mockResolvedValue({ id: 'token-id' }),
  } as unknown as IRefreshTokenRepository

  const mockJwtSign = vi.fn((payload, options?) => {
    return `mock-token-${payload.sub}-${options?.expiresIn || '15m'}`
  })

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
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

    const result = await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(result).toEqual({
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    })
  })

  it('should throw AppError when user not found', async () => {
    const mockRepo = createMockUserRepository({
      findByEmailResult: null,
    })
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

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
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

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
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

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
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

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

  it('should store refresh token in repository', async () => {
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
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

    await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        expiresAt: expect.any(Date),
        tokenHash: expect.any(String),
        id: expect.any(String),
      })
    )
  })

  it('should handle case-insensitive email lookup', async () => {
    const passwordHash = await Password.hash('correctPassword')
    const existingUser: IUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'JOHN@EXAMPLE.COM',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser

    const mockRepo = createMockUserRepository({
      findByEmailResult: existingUser,
    })
    const useCase = new LoginUser(mockRepo, mockRefreshTokenRepository, mockJwtSign)

    const result = await useCase.execute({
      email: 'john@example.com',
      password: 'correctPassword',
    })

    expect(result.user.email).toBe('JOHN@EXAMPLE.COM')
  })
})
