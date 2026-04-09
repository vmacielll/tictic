import { prisma } from '../../../../infra/database/prisma/PrismaClient'
import type { IUserRepository, IUser } from '../../domain/repositories/IUserRepository'

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return this.toDomain(user)
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return this.toDomain(user)
  }

  async create(data: { id: string; name: string; email: string; passwordHash: string }): Promise<IUser> {
    const user = await prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    })
    return this.toDomain(user)
  }

  async save(user: IUser): Promise<IUser> {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
      },
    })
    return this.toDomain(updated)
  }

  private toDomain(prismaUser: { id: string; name: string; email: string; passwordHash: string; createdAt: Date; updatedAt: Date }): IUser {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }
  }
}
