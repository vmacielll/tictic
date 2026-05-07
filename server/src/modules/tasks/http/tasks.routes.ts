import type { FastifyInstance } from 'fastify'
import type { TasksController } from './TasksController'
import {
  TaskParamsSchema,
  TaskResponseSchema,
  TaskListResponseSchema,
  TaskArrayResponseSchema,
  PaginationQuerySchema,
  ErrorResponseSchema,
  CreateTaskBodySchema,
  UpdateTaskBodySchema,
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
    preHandler: [(app as any).authenticate],
    schema: {
      body: CreateTaskBodySchema,
      response: {
        201: TaskResponseSchema,
      },
    },
  }, controller.create.bind(controller))

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
        200: TaskArrayResponseSchema,
      },
    },
  }, controller.listToday.bind(controller))

  app.get('/tasks/inbox', {
    schema: {
      response: {
        200: TaskArrayResponseSchema,
      },
    },
  }, controller.listInbox.bind(controller))

  app.get('/tasks/:id', {
    schema: {
      params: TaskParamsSchema,
      response: {
        200: TaskResponseSchema,
      },
    },
  }, controller.get.bind(controller))

  app.patch('/tasks/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      params: TaskParamsSchema,
      body: UpdateTaskBodySchema,
    },
  }, controller.update.bind(controller))

  app.delete('/tasks/:id', {
    preHandler: [(app as any).authenticate],
    schema: {
      params: TaskParamsSchema,
    },
  }, controller.delete.bind(controller))
}