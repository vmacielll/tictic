import { FastifyReply, FastifyRequest } from 'fastify'
import { type StartPomodoro } from '../application/use-cases/StartPomodoro'
import { type CompletePomodoro } from '../application/use-cases/CompletePomodoro'
import { type CancelPomodoro } from '../application/use-cases/CancelPomodoro'
import { type ListPomodoros } from '../application/use-cases/ListPomodoros'
import { type GetActivePomodoro } from '../application/use-cases/GetActivePomodoro'
import { toHttpError } from '../../../shared/errors/HttpError'
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
    const body = request.body as Record<string, any>

    try {
      const duration = typeof body.duration === 'number' && body.duration > 0 ? body.duration : 25
      const taskId = typeof body.taskId === 'string' && body.taskId.length > 0 ? body.taskId : undefined

      const result = await this.startPomodoro.execute({
        userId: req.userId,
        duration,
        taskId,
      })

      return reply.status(201).send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as Record<string, any>

    try {
      const result = await this.completePomodoro.execute({
        sessionId: params.id,
        userId: req.userId,
      })

      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const params = request.params as Record<string, any>

    try {
      const result = await this.cancelPomodoro.execute({
        sessionId: params.id,
        userId: req.userId,
      })

      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.listPomodoros.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }

  async getActive(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    try {
      const result = await this.getActivePomodoro.execute({ userId: req.userId })
      return reply.send(result)
    } catch (error) {
      return reply.status(500).send(toHttpError(error as Error))
    }
  }
}
