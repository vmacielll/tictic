import type { IUser } from '../../modules/auth/domain/repositories/IUserRepository'

interface PrismaUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export function prismaUserToDomain(prismaUser: PrismaUser): IUser {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    passwordHash: prismaUser.passwordHash,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  }
}