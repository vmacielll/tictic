import type { IListRepository } from '../../domain/repositories/IListRepository'
import { List } from '../../domain/entities/List'
import { AppError } from '@shared/errors/AppError'

interface UpdateListRequest {
  listId: string
  userId: string
  name?: string
  color?: string
}

interface UpdateListResponse {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: Date
}

export class UpdateList {
  constructor(private readonly listRepository: IListRepository) {}

  async execute(request: UpdateListRequest): Promise<UpdateListResponse> {
    const list = await this.listRepository.findById(request.listId)
    if (!list) {
      throw new AppError('List not found', 404, 'LIST_NOT_FOUND')
    }

    if (list.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    if (request.name !== undefined) {
      list.updateName(request.name)
    }
    if (request.color !== undefined) {
      list.updateColor(request.color)
    }

    const updated = await this.listRepository.save(list)

    return this.toResponse(updated)
  }

  private toResponse(list: List): UpdateListResponse {
    return {
      id: list.id,
      name: list.name.value,
      color: list.color,
      userId: list.userId,
      createdAt: list.createdAt,
    }
  }
}
