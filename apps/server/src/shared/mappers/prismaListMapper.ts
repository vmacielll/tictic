import { List } from '@modules/lists/domain/entities/List'
import { ListName } from '@modules/lists/domain/value-objects/ListName'

interface PrismaList {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: Date
}

export function prismaListToDomain(prismaList: PrismaList): List {
  return List.reconstitute({
    id: prismaList.id,
    name: new ListName(prismaList.name),
    color: prismaList.color ?? undefined,
    userId: prismaList.userId,
    createdAt: prismaList.createdAt,
  })
}