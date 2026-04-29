import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { GetCalendarMonth } from '../application/use-cases/GetCalendarMonth'
import { GetCalendarWeek } from '../application/use-cases/GetCalendarWeek'
import { GetCalendarDay } from '../application/use-cases/GetCalendarDay'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { CalendarMonthQuerySchema, CalendarWeekQuerySchema, CalendarDayQuerySchema } from './schemas'
import type { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

export class CalendarController {
  constructor(
    private readonly getCalendarMonth: GetCalendarMonth,
    private readonly getCalendarWeek: GetCalendarWeek,
    private readonly getCalendarDay: GetCalendarDay,
  ) {}

  async getMonth(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const queryResult = CalendarMonthQuerySchema.safeParse(request.query)
    if (!queryResult.success) {
      return validationError(reply, queryResult.error)
    }
    const { month, year } = queryResult.data

    try {
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

    const queryResult = CalendarWeekQuerySchema.safeParse(request.query)
    if (!queryResult.success) {
      return validationError(reply, queryResult.error)
    }
    const { date: dateString } = queryResult.data

    try {
      const result = await this.getCalendarWeek.execute({
        userId: req.userId,
        date: dateString,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async getDay(request: FastifyRequest, reply: FastifyReply) {
    const req = request as AuthenticatedRequest

    const queryResult = CalendarDayQuerySchema.safeParse(request.query)
    if (!queryResult.success) {
      return validationError(reply, queryResult.error)
    }
    const { date: dateString } = queryResult.data

    try {
      const result = await this.getCalendarDay.execute({
        userId: req.userId,
        date: dateString,
        timezone: req.userTimezone,
      })
      return reply.send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
