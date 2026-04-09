import { prisma } from '../../../../infra/database/prisma/PrismaClient'
import type { IListRepository } from '../../domain/repositories/IListRepository'
import { List } from '../../domain/entities/List'
import { ListName } from '../../domain/value-objects/ListName'

export class PrismaListRepository implements IListRepository {
  async create(data: { id: string; name: string; color?: string; userId: string }): Promise<List> {
    const prismaList = await prisma.list.create({
      data: {
        id: data.id,
        name: data.name,
        color: data.color,
        userId: data.userId,
      },
    })

    return this.toEntity(prismaList)
  }

  async findById(id: string): Promise<List | null> {
    const prismaList = await prisma.list.findUnique({ where: { id } })
    if (!prismaList) return null
    return this.toEntity(prismaList)
  }

  async findByUserId(userId: string): Promise<List[]> {
    const prismaLists = await prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return prismaLists.map(this.toEntity)
  }

  async save(list: List): Promise<List> {
    const prismaList = await prisma.list.update({
      where: { id: list.id },
      data: {
        name: list.name.value,
        color: list.color,
      },
    })

    return this.toEntity(prismaList)
  }

  async delete(id: string): Promise<void> {
    await prisma.list.delete({ where: { id } })
  }

  private toEntity(prismaList: { id: string; name: string; color: string | null; userId: string; createdAt: Date }): List {
    return List.reconstitute({
      id: prismaList.id,
      name: new ListName(prismaList.name),
      color: prismaList.color ?? undefined,
      userId: prismaList.userId,
      createdAt: prismaList.createdAt,
    })
  }
}
