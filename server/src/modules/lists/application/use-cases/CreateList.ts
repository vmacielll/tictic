import type { IListRepository } from '../../domain/repositories/IListRepository'
import { List } from '../../domain/entities/List'

interface CreateListRequest {
  userId: string
  name: string
  color?: string
}

interface CreateListResponse {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: Date
}

export class CreateList {
  constructor(private readonly listRepository: IListRepository) {}

  async execute(request: CreateListRequest): Promise<CreateListResponse> {
    const list = List.create(request.userId, request.name, request.color)

    const created = await this.listRepository.create({
      id: list.id,
      name: list.name.value,
      color: list.color,
      userId: list.userId,
    })

    return this.toResponse(created)
  }

  private toResponse(list: List): CreateListResponse {
    return {
      id: list.id,
      name: list.name.value,
      color: list.color,
      userId: list.userId,
      createdAt: list.createdAt,
    }
  }
}
