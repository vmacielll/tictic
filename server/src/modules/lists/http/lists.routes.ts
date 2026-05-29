import type { FastifyInstance } from 'fastify'
import type { ListsController } from './ListsController'

export async function listsRoutes(app: FastifyInstance) {
  const controller = app.listsController as ListsController

  app.post('/lists', {
    preHandler: [app.authenticate],
  }, controller.create.bind(controller))
  app.get('/lists', {
    preHandler: [app.authenticate],
  }, controller.list.bind(controller))
  app.patch('/lists/:id', {
    preHandler: [app.authenticate],
  }, controller.update.bind(controller))
  app.delete('/lists/:id', {
    preHandler: [app.authenticate],
  }, controller.delete.bind(controller))
}
