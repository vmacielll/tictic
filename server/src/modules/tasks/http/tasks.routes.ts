import type { FastifyInstance } from 'fastify'
import type { TasksController } from './TasksController'
import {
  TaskParamsSchema,
  TaskResponseSchema,
  TaskListResponseSchema,
  PaginationQuerySchema,
  ErrorResponseSchema,
} from './schemas'

export async function tasksRoutes(app: FastifyInstance) {
  const controller = (app as any).tasksController as TasksController

  app.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
      const token = request.user as { sub: string }
      ;(request as any).userId = token.sub
    } catch {
      return reply.unauthorized('Unauthorized')
    }
  })

  app.post('/tasks', {
    schema: {
      response: {
        201: TaskResponseSchema,
      },
    },
  }, controller.create.bind(controller))

  app.patch('/tasks/:id', {
    schema: {
      params: TaskParamsSchema,
      response: {
        200: TaskResponseSchema,
      },
    },
  }, controller.update.bind(controller))

  app.patch('/tasks/:id/complete', {
    schema: {
      params: TaskParamsSchema,
      response: {
        200: TaskResponseSchema,
      },
    },
  }, controller.complete.bind(controller))

  app.patch('/tasks/:id/uncomplete', {
    schema: {
      params: TaskParamsSchema,
      response: {
        200: TaskResponseSchema,
      },
    },
  }, controller.uncomplete.bind(controller))

  app.delete('/tasks/:id', {
    schema: {
      params: TaskParamsSchema,
    },
  }, controller.delete.bind(controller))

  app.get('/tasks', {
    schema: {
      querystring: PaginationQuerySchema,
      response: {
        200: TaskListResponseSchema,
      },
    },
  }, controller.list.bind(controller))

  app.get('/tasks/today', {
    schema: {
      response: {
        200: TaskListResponseSchema,
      },
    },
  }, controller.listToday.bind(controller))

  app.get('/tasks/inbox', {
    schema: {
      response: {
        200: TaskListResponseSchema,
      },
    },
  }, controller.listInbox.bind(controller))
}
