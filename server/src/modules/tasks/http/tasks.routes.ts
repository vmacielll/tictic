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
  const controller = app.tasksController as TasksController

  app.post('/tasks', {
    preHandler: [app.authenticate],
    schema: {
      body: CreateTaskBodySchema,
      response: {
        201: TaskResponseSchema,
      },
    },
  }, controller.create.bind(controller))

  app.get('/tasks', {
    preHandler: [app.authenticate],
    schema: {
      querystring: PaginationQuerySchema,
      response: {
        200: TaskListResponseSchema,
      },
    },
  }, controller.list.bind(controller))

  app.get('/tasks/today', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: TaskArrayResponseSchema,
      },
    },
  }, controller.listToday.bind(controller))

  app.get('/tasks/inbox', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: TaskArrayResponseSchema,
      },
    },
  }, controller.listInbox.bind(controller))

  app.get('/tasks/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: TaskParamsSchema,
      response: {
        200: TaskResponseSchema,
      },
    },
  }, controller.get.bind(controller))

  app.patch('/tasks/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: TaskParamsSchema,
      body: UpdateTaskBodySchema,
    },
  }, controller.update.bind(controller))

  app.delete('/tasks/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: TaskParamsSchema,
    },
  }, controller.delete.bind(controller))
}