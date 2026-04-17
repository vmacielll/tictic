import type { PrismaClient } from '@prisma/client'
import type { IListRepository } from '../../domain/repositories/IListRepository'
import { List } from '../../domain/entities/List'
import { prismaListToDomain } from '@shared/mappers/prismaListMapper'

export class PrismaListRepository implements IListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { id: string; name: string; color?: string; userId: string }): Promise<List> {
    const prismaList = await this.prisma.list.create({
      data: {
        id: data.id,
        name: data.name,
        color: data.color,
        userId: data.userId,
      },
    })

    return prismaListToDomain(prismaList)
  }

  async findById(id: string): Promise<List | null> {
    const prismaList = await this.prisma.list.findUnique({ where: { id } })
    if (!prismaList) return null
    return prismaListToDomain(prismaList)
  }

  async findByUserId(userId: string): Promise<List[]> {
    const prismaLists = await this.prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return prismaLists.map(prismaListToDomain)
  }

  async save(list: List): Promise<List> {
    const prismaList = await this.prisma.list.update({
      where: { id: list.id },
      data: {
        name: list.name.value,
        color: list.color,
      },
    })

    return prismaListToDomain(prismaList)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.list.delete({ where: { id } })
  }
}
