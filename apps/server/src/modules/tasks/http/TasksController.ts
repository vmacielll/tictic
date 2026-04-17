import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { ZodError } from 'zod'
import { CreateTask } from '../application/use-cases/CreateTask'
import { UpdateTask } from '../application/use-cases/UpdateTask'
import { CompleteTask } from '../application/use-cases/CompleteTask'
import { UncompleteTask } from '../application/use-cases/UncompleteTask'
import { DeleteTask } from '../application/use-cases/DeleteTask'
import { ListTasks } from '../application/use-cases/ListTasks'
import { ListTasksByDate } from '../application/use-cases/ListTasksByDate'
import { ListInboxTasks } from '../application/use-cases/ListInboxTasks'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { CreateTaskSchema, UpdateTaskSchema, TaskIdSchema } from './schemas'
import type { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

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

    const parseResult = CreateTaskSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const { title, description, priority, dueDate, dueTime, listId } = parseResult.data

    try {
      const result = await this.createTask.execute({
        userId: req.userId,
        title,
        description,
        priority,
        dueDate: dueDate ? DateTime.fromISO(dueDate, { zone: req.userTimezone }).toUTC().toJSDate() : undefined,
        dueTime: dueTime ? DateTime.fromISO(dueTime, { zone: req.userTimezone }).toUTC().toJSDate() : undefined,
        listId,
      })
      return reply.status(201).send(result)
    } catch (error) {
       request.log.error(error);
       return handleError(error, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    const parseResult = UpdateTaskSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const body = parseResult.data

    try {
      const result = await this.updateTask.execute({
        taskId: id,
        userId: req.userId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        dueDate: body.dueDate ? DateTime.fromISO(body.dueDate, { zone: req.userTimezone }).toUTC().toJSDate() : undefined,
        dueTime: body.dueTime ? DateTime.fromISO(body.dueTime, { zone: req.userTimezone }).toUTC().toJSDate() : undefined,
        listId: body.listId,
      })
      return reply.send(result)
    } catch (error) {
      request.log.error({ error, taskId: id, userId: req.userId }, 'Error updating task')
      return handleError(error, reply)
    }
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    try {
      const result = await this.completeTask.execute({
        taskId: id,
        userId: req.userId,
      })
      return reply.send(result)
    } catch (error) {
      request.log.error({ error, taskId: id, userId: req.userId }, 'Error completing task')
      return handleError(error, reply)
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listTasks.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async listToday(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      // Get current date in user's timezone (not UTC)
      const now = DateTime.now().setZone(req.userTimezone)
      const today = now.toJSDate()

      const result = await this.listTasksByDate.execute({
        userId: req.userId,
        date: today,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async listInbox(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listInboxTasks.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async uncomplete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    try {
      const result = await this.uncompleteTask.execute({
        taskId: id,
        userId: req.userId,
      })
      return reply.send(result)
    } catch (error) {
      request.log.error({ error, taskId: id, userId: req.userId }, 'Error uncompleting task')
      return handleError(error, reply)
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = TaskIdSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id } = paramsResult.data

    try {
      await this.deleteTask.execute({
        taskId: id,
        userId: req.userId,
      })
      return reply.status(204).send()
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
