import crypto from 'crypto'
import type { PrismaClient } from '@prisma/client'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import { User } from '../../domain/entities/User'
import { prismaUserToDomain } from '@shared/mappers/prismaUserMapper'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    })
    if (!user) return null
    return prismaUserToDomain(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    })
    if (!user) return null
    return prismaUserToDomain(user)
  }

  async create(data: { id: string; name: string; email: string; passwordHash: string }): Promise<User> {
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

  async save(user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email.toString(),
        updatedAt: user.updatedAt,
      },
    })
    return prismaUserToDomain(updated)
  }

  async updatePasswordAndRevokeTokens(id: string, hash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash: hash },
      })
      await tx.refreshToken.updateMany({
        where: { userId: id },
        data: { revoked: true },
      })
    })
  }

  async softDeleteAndRevokeTokens(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id, deletedAt: null },
        select: { email: true },
      })
      if (!user) return

      const prefix = crypto.randomUUID().slice(0, 8)
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          email: `deleted_${prefix}_${user.email}`,
        },
      })

      await tx.refreshToken.updateMany({
        where: { userId: id },
        data: { revoked: true },
      })
    })
  }
}
