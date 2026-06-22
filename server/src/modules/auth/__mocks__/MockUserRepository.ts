import type { IUserRepository, IUser } from '../domain/repositories/IUserRepository'
import { vi } from 'vitest'

export function createMockUserRepository(overrides?: {
  findByEmailResult?: IUser | null
  findByIdResult?: IUser | null
  createResult?: IUser
  saveResult?: IUser
}): IUserRepository {
  const defaultUser: IUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return {
    findByEmail: vi.fn().mockResolvedValue(overrides?.findByEmailResult ?? null),
    findById: vi.fn().mockResolvedValue(overrides?.findByIdResult ?? null),
    create: vi.fn().mockResolvedValue(overrides?.createResult ?? defaultUser),
    save: vi.fn().mockResolvedValue(overrides?.saveResult ?? defaultUser),
    updatePasswordAndRevokeTokens: vi.fn().mockResolvedValue(undefined),
    softDeleteAndRevokeTokens: vi.fn().mockResolvedValue(undefined),
  }
}
