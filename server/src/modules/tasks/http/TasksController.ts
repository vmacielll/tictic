import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { CreateTask } from '../application/use-cases/CreateTask'
import { UpdateTask } from '../application/use-cases/UpdateTask'
import { CompleteTask } from '../application/use-cases/CompleteTask'
import { UncompleteTask } from '../application/use-cases/UncompleteTask'
import { DeleteTask } from '../application/use-cases/DeleteTask'
import { ListTasks } from '../application/use-cases/ListTasks'
import { ListTasksByDate } from '../application/use-cases/ListTasksByDate'
import { ListInboxTasks } from '../application/use-cases/ListInboxTasks'
import type { AuthenticatedRequest } from '@shared/middleware/authMiddleware'

export class TasksController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly updateTask: UpdateTask,
    private readonly completeTask: CompleteTask,
    private readonly uncompleteTask: UncompleteTask,
    private readonly deleteTask: DeleteTask,
    private readonly listTasks: ListTasks,
    private readonly listTasksByDate: ListTasksByDate,
    private readonly listInboxTasks: ListInboxTasks,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const body = request.body as any

    const result = await this.createTask.execute({
      userId: req.userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      dueTimezone: req.userTimezone,
      listId: body.listId,
    })
    return reply.status(201).send(result)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as { id: string }
    const body = request.body as any

    const result = await this.updateTask.execute({
      taskId: params.id,
      userId: req.userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      dueTimezone: req.userTimezone,
      listId: body.listId,
    })
    return reply.send(result)
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as { id: string }

    const result = await this.completeTask.execute({
      taskId: params.id,
      userId: req.userId,
    })
    return reply.send(result)
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const query = request.query as any

    const pagination = { skip: (query.page - 1) * query.size, take: query.size }
    const result = await this.listTasks.execute({ userId: req.userId, pagination })
    return reply.send(result)
  }

  async listToday(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const now = DateTime.now().setZone(req.userTimezone)
    const today = now.toFormat('yyyy-MM-dd')

    const result = await this.listTasksByDate.execute({
      userId: req.userId,
      date: today,
      timezone: req.userTimezone,
    })
    return reply.send(result)
  }

  async listInbox(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const result = await this.listInboxTasks.execute({ userId: req.userId })
    return reply.send(result)
  }

  async uncomplete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as { id: string }

    const result = await this.uncompleteTask.execute({
      taskId: params.id,
      userId: req.userId,
    })
    return reply.send(result)
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as { id: string }

    await this.deleteTask.execute({
      taskId: params.id,
      userId: req.userId,
    })
    return reply.status(204).send()
  }
}