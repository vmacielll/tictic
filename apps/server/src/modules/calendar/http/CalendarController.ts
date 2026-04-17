import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { GetCalendarMonth } from '../application/use-cases/GetCalendarMonth'
import { GetCalendarWeek } from '../application/use-cases/GetCalendarWeek'
import { GetCalendarDay } from '../application/use-cases/GetCalendarDay'
import { handleError } from '../../../shared/utils/handleError'
import type { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

export class CalendarController {
  constructor(
    private readonly getCalendarMonth: GetCalendarMonth,
    private readonly getCalendarWeek: GetCalendarWeek,
    private readonly getCalendarDay: GetCalendarDay,
  ) {}

  async getMonth(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const query = request.query as { month?: string; year?: string }

    try {
      const month = parseInt(query.month!, 10)
      const year = parseInt(query.year!, 10)

      if (isNaN(month) || isNaN(year)) {
        return reply.status(400).send({ message: 'Invalid month or year', code: 'INVALID_INPUT', statusCode: 400 })
      }

      const result = await this.getCalendarMonth.execute({
        userId: req.userId,
        month,
        year,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async getWeek(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const query = request.query as { date?: string }

    try {
      const dateString = query.date!
      // Parse date string in user's timezone
      const [year, month, day] = dateString.split('-').map(Number)
      const date = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: req.userTimezone }).toJSDate()

      const result = await this.getCalendarWeek.execute({
        userId: req.userId,
        date,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async getDay(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest
    const query = request.query as { date?: string }

    try {
      const dateString = query.date!
      // Parse date string in user's timezone
      const [year, month, day] = dateString.split('-').map(Number)
      const date = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: req.userTimezone }).toJSDate()

      const result = await this.getCalendarDay.execute({
        userId: req.userId,
        date,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
