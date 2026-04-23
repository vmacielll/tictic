import type { FastifyInstance } from 'fastify'
import type { TasksController } from './TasksController'

export async function tasksRoutes(app: FastifyInstance) {
  const controller = (app as any).tasksController as TasksController

  app.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
      const token = request.user as { sub: string }
      ;(request as any).userId = token.sub
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  app.post('/tasks', {}, controller.create.bind(controller))
  app.patch('/tasks/:id', {}, controller.update.bind(controller))
  app.patch('/tasks/:id/complete', {}, controller.complete.bind(controller))
  app.patch('/tasks/:id/uncomplete', {}, controller.uncomplete.bind(controller))
  app.delete('/tasks/:id', {}, controller.delete.bind(controller))
  app.get('/tasks', {}, controller.list.bind(controller))
  app.get('/tasks/today', {}, controller.listToday.bind(controller))
  app.get('/tasks/inbox', {}, controller.listInbox.bind(controller))
}
