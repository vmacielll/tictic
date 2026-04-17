import type { PrismaClient } from '@prisma/client'
import type { IUserRepository, IUser } from '../../domain/repositories/IUserRepository'
import { prismaUserToDomain } from '../../../../shared/mappers/prismaUserMapper'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return prismaUserToDomain(user)
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return prismaUserToDomain(user)
  }

  async create(data: { id: string; name: string; email: string; passwordHash: string }): Promise<IUser> {
    const user = await this.prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    })
    return prismaUserToDomain(user)
  }

  async save(user: IUser): Promise<IUser> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
      },
    })
    return prismaUserToDomain(updated)
  }
}
