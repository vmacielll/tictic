import { FastifyReply, FastifyRequest } from 'fastify'
import { type StartPomodoro } from '../application/use-cases/StartPomodoro'
import { type CompletePomodoro } from '../application/use-cases/CompletePomodoro'
import { type CancelPomodoro } from '../application/use-cases/CancelPomodoro'
import { type ListPomodoros } from '../application/use-cases/ListPomodoros'
import { type GetActivePomodoro } from '../application/use-cases/GetActivePomodoro'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { StartPomodoroSchema, CompletePomodoroSchema, CancelPomodoroSchema } from './schemas'
import { type AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

export class PomodoroController {
  constructor(
    private readonly startPomodoro: StartPomodoro,
    private readonly completePomodoro: CompletePomodoro,
    private readonly cancelPomodoro: CancelPomodoro,
    private readonly listPomodoros: ListPomodoros,
    private readonly getActivePomodoro: GetActivePomodoro,
  ) {}

  async start(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const parseResult = StartPomodoroSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const { duration, taskId } = parseResult.data

    try {
      const result = await this.startPomodoro.execute({
        userId: req.userId,
        duration,
        taskId,
      })

      return reply.status(201).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = CompletePomodoroSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id: sessionId } = paramsResult.data

    try {
      const result = await this.completePomodoro.execute({
        sessionId,
        userId: req.userId,
      })

      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const paramsResult = CancelPomodoroSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return validationError(reply, paramsResult.error)
    }
    const { id: sessionId } = paramsResult.data

    try {
      const result = await this.cancelPomodoro.execute({
        sessionId,
        userId: req.userId,
      })

      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listPomodoros.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async getActive(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.getActivePomodoro.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
