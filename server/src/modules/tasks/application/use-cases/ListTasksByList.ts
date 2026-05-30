import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { PaginationParams } from '@shared/types/pagination'
import { toTaskResponse, type TaskResponse } from '../../http/mappers/taskResponse'

interface ListTasksByListRequest {
  userId: string
  listId: string
  pagination?: PaginationParams
}

export interface ListTasksByListOutput {
  items: TaskResponse[]
  meta: {
    page: number
    size: number
    totalCount: number
  }
}

export class ListTasksByList {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: ListTasksByListRequest): Promise<ListTasksByListOutput> {
    const { userId, listId, pagination } = request
    const page = pagination?.skip ? Math.floor(pagination.skip / (pagination.take || 20)) + 1 : 1
    const size = pagination?.take || 20

    const [tasks, totalCount] = await Promise.all([
      this.taskRepository.findByListId(userId, listId, pagination),
      this.taskRepository.countByListId(userId, listId),
    ])

    return {
      items: tasks.map(toTaskResponse),
      meta: { page, size, totalCount },
    }
  }
}
