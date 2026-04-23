import type { IListRepository } from '../../domain/repositories/IListRepository'

interface ListUserListsRequest {
  userId: string
}

interface ListUserListsResponse {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: Date
}

export class ListUserLists {
  constructor(private readonly listRepository: IListRepository) {}

  async execute(request: ListUserListsRequest): Promise<ListUserListsResponse[]> {
    const lists = await this.listRepository.findByUserId(request.userId)
    return lists.map(this.toResponse)
  }

  private toResponse(list: { id: string; name: { value: string }; color?: string; userId: string; createdAt: Date }): ListUserListsResponse {
    return {
      id: list.id,
      name: list.name.value,
      color: list.color,
      userId: list.userId,
      createdAt: list.createdAt,
    }
  }
}
