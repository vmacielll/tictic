import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { CreateTask } from '../application/use-cases/CreateTask'
import { GetTask } from '../application/use-cases/GetTask'
import { UpdateTask } from '../application/use-cases/UpdateTask'
import { DeleteTask } from '../application/use-cases/DeleteTask'
import { ListTasks } from '../application/use-cases/ListTasks'
import { ListTasksByDate } from '../application/use-cases/ListTasksByDate'
import { ListInboxTasks } from '../application/use-cases/ListInboxTasks'
import type { AuthenticatedRequest } from '@shared/middleware/authMiddleware'
import { validationError } from '@shared/utils/validationError'
import { CreateTaskSchema, UpdateTaskSchema, TaskParamsSchema } from './schemas/tasks.zod'
import type { z } from 'zod'

export class TasksController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly getTask: GetTask,
    private readonly updateTask: UpdateTask,
    private readonly deleteTask: DeleteTask,
    private readonly listTasks: ListTasks,
    private readonly listTasksByDate: ListTasksByDate,
    private readonly listInboxTasks: ListInboxTasks,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const parseResult = CreateTaskSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const data = parseResult.data as z.infer<typeof CreateTaskSchema>

    const result = await this.createTask.execute({
      userId: req.userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ?? undefined,
      dueTime: data.dueTime ?? undefined,
      dueTimezone: req.userTimezone,
      listId: data.listId ?? undefined,
    })
    return reply.status(201).send(result)
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskParamsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const paramsData = paramsResult.data as z.infer<typeof TaskParamsSchema>

    const result = await this.getTask.execute({
      taskId: paramsData.id,
      userId: req.userId,
    })
    return reply.send(result)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskParamsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const paramsData = paramsResult.data as z.infer<typeof TaskParamsSchema>
    const id = paramsData.id

    const parseResult = UpdateTaskSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const data = parseResult.data as z.infer<typeof UpdateTaskSchema>

    const result = await this.updateTask.execute({
      taskId: id,
      userId: req.userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ?? undefined,
      dueTime: data.dueTime ?? undefined,
      dueTimezone: data.dueTimezone ?? req.userTimezone,
      listId: data.listId ?? undefined,
      completed: data.completed,
    })
    return reply.send(result)
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const query = request.query as { page?: string; size?: string }

    const page = Number(query.page) || 1
    const size = Number(query.size) || 20
    const pagination = { skip: (page - 1) * size, take: size }
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

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskParamsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const paramsData = paramsResult.data as z.infer<typeof TaskParamsSchema>

    await this.deleteTask.execute({
      taskId: paramsData.id,
      userId: req.userId,
    })
    return reply.status(204).send()
  }
}