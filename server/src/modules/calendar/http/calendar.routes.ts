import type { FastifyInstance } from 'fastify'
import type { CalendarController } from './CalendarController'

export async function calendarRoutes(app: FastifyInstance) {
  const controller = app.calendarController as CalendarController

  app.get('/calendar/month', {
    preHandler: [app.authenticate],
  }, controller.getMonth.bind(controller))
  app.get('/calendar/week', {
    preHandler: [app.authenticate],
  }, controller.getWeek.bind(controller))
  app.get('/calendar/day', {
    preHandler: [app.authenticate],
  }, controller.getDay.bind(controller))
}
