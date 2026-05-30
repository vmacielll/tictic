import type { IListRepository } from '../../domain/repositories/IListRepository'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'

interface DeleteListRequest {
  listId: string
  userId: string
}

export class DeleteList {
  constructor(private readonly listRepository: IListRepository) {}

  async execute(request: DeleteListRequest): Promise<void> {
    const list = await this.listRepository.findById(request.listId, request.userId)
    if (!list) {
      throw new AppError('List not found', 404, 'LIST_NOT_FOUND')
    }

    ensureOwnership(list, request.userId, 'list')

    await this.listRepository.delete(request.listId, request.userId)
  }
}
