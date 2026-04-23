import type { FastifyInstance } from 'fastify'
import type { ListsController } from './ListsController'

export async function listsRoutes(app: FastifyInstance) {
  const controller = (app as any).listsController as ListsController

  app.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
      const token = request.user as { sub: string }
      ;(request as any).userId = token.sub
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  app.post('/lists', {}, controller.create.bind(controller))
  app.get('/lists', {}, controller.list.bind(controller))
  app.patch('/lists/:id', {}, controller.update.bind(controller))
  app.delete('/lists/:id', {}, controller.delete.bind(controller))
}
