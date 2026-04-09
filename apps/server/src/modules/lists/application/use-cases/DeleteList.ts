import type { IListRepository } from '../../domain/repositories/IListRepository'
import { AppError } from '../../../../shared/errors/AppError'

interface DeleteListRequest {
  listId: string
  userId: string
}

export class DeleteList {
  constructor(private readonly listRepository: IListRepository) {}

  async execute(request: DeleteListRequest): Promise<void> {
    const list = await this.listRepository.findById(request.listId)
    if (!list) {
      throw new AppError('List not found', 404, 'LIST_NOT_FOUND')
    }

    if (list.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    await this.listRepository.delete(request.listId)
  }
}
