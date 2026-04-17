import { FastifyReply, FastifyRequest } from 'fastify'
import { CreateList } from '../application/use-cases/CreateList'
import { UpdateList } from '../application/use-cases/UpdateList'
import { DeleteList } from '../application/use-cases/DeleteList'
import { ListUserLists } from '../application/use-cases/ListUserLists'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { CreateListSchema, UpdateListSchema, ListIdSchema } from './schemas'
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

    const parseResult = CreateListSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const { name, color } = parseResult.data

    try {
      const result = await this.createList.execute({
        userId: req.userId,
        name,
        color,
      })
      return reply.status(201).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = ListIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    const parseResult = UpdateListSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const body = parseResult.data

    try {
      const result = await this.updateList.execute({
        listId: id,
        userId: req.userId,
        name: body.name,
        color: body.color,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = ListIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    try {
      await this.deleteList.execute({ listId: id, userId: req.userId })
      return reply.status(204).send()
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listUserLists.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
