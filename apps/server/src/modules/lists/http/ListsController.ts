import { FastifyReply, FastifyRequest } from 'fastify'
import { CreateList } from '../application/use-cases/CreateList'
import { UpdateList } from '../application/use-cases/UpdateList'
import { DeleteList } from '../application/use-cases/DeleteList'
import { ListUserLists } from '../application/use-cases/ListUserLists'
import { toHttpError } from '../../../shared/errors/HttpError'
import type { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

export class ListsController {
  constructor(
    private readonly createList: CreateList,
    private readonly updateList: UpdateList,
    private readonly deleteList: DeleteList,
    private readonly listUserLists: ListUserLists,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const { name, color } = request.body as { name: string; color?: string }

    try {
      const result = await this.createList.execute({
        userId: req.userId,
        name,
        color,
      })
      return reply.status(201).send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; color?: string }

    try {
      const result = await this.updateList.execute({
        listId: id,
        userId: req.userId,
        name: body.name,
        color: body.color,
      })
      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const { id } = request.params as { id: string }

    try {
      await this.deleteList.execute({ listId: id, userId: req.userId })
      return reply.status(204).send()
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listUserLists.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }
}
