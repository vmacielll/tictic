import { User } from '../entities/User'

// Legacy interface for backward compatibility
export interface IUser {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: {
    id: string
    name: string
    email: string
    passwordHash: string
  }): Promise<User>
  save(user: User): Promise<User>
  updatePasswordAndRevokeTokens(id: string, hash: string): Promise<void>
  softDeleteAndRevokeTokens(id: string): Promise<void>
}
