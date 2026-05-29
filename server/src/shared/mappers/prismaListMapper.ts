import { List } from '@modules/lists/domain/entities/List'
import { ListName } from '@modules/lists/domain/value-objects/ListName'
import type { List as PrismaList } from '@prisma/client'
import type { Mapper } from './Mapper'

export const prismaListMapper: Mapper<List, PrismaList> = {
  toDomain(prismaList: PrismaList): List {
    return List.reconstitute({
      id: prismaList.id,
      name: new ListName(prismaList.name),
      color: prismaList.color ?? undefined,
      userId: prismaList.userId,
      createdAt: prismaList.createdAt,
    })
  },
  toPrisma(domain: List): PrismaList {
    return {
      id: domain.id,
      name: domain.name.value,
      color: domain.color ?? null,
      userId: domain.userId,
      createdAt: domain.createdAt,
    } as PrismaList
  },
}

export function prismaListToDomain(prismaList: PrismaList): List {
  return prismaListMapper.toDomain(prismaList)
}