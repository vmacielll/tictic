import { User } from '@modules/auth/domain/entities/User'
import type { User as PrismaUser } from '@prisma/client'
import type { Mapper } from './Mapper'

export const prismaUserMapper: Mapper<User, PrismaUser> = {
  toDomain(prismaUser: PrismaUser): User {
    return User.reconstitute({
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    })
  },
  toPrisma(domain: User): PrismaUser {
    return {
      id: domain.id,
      name: domain.name,
      email: domain.email.toString(),
      passwordHash: domain.passwordHash,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    } as PrismaUser
  },
}

export function prismaUserToDomain(prismaUser: PrismaUser): User {
  return prismaUserMapper.toDomain(prismaUser)
}