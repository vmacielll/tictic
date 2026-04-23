import type { FastifyInstance } from 'fastify'
import type { CalendarController } from './CalendarController'
import type { AuthenticatedRequest } from '../../../shared/middleware/authMiddleware'

export async function calendarRoutes(app: FastifyInstance) {
  const controller = (app as any).calendarController as CalendarController

  app.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
      const token = request.user as { sub: string }
      ;(request as AuthenticatedRequest).userId = token.sub
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  app.get('/calendar/month', {}, controller.getMonth.bind(controller))
  app.get('/calendar/week', {}, controller.getWeek.bind(controller))
  app.get('/calendar/day', {}, controller.getDay.bind(controller))
}
