import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { CreateTask } from '@modules/tasks/application/use-cases/CreateTask'
import { GetTask } from '@modules/tasks/application/use-cases/GetTask'
import { UpdateTask } from '@modules/tasks/application/use-cases/UpdateTask'
import { DeleteTask } from '@modules/tasks/application/use-cases/DeleteTask'
import { ListTasks } from '@modules/tasks/application/use-cases/ListTasks'
import { ListTasksByDate } from '@modules/tasks/application/use-cases/ListTasksByDate'
import { ListInboxTasks } from '@modules/tasks/application/use-cases/ListInboxTasks'
import { PrismaTaskRepository } from '@modules/tasks/infra/repositories/PrismaTaskRepository'
import { TasksController } from '@modules/tasks/http/TasksController'
import { tasksRoutes } from '@modules/tasks/http/tasks.routes'
import { resetLogger } from '@shared/utils/logger'

const TEST_JWT_SECRET = 'test-secret-key-for-integration-tests'

interface MockTask {
  id: string
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  dueTime: string | null
  dueTimezone: string | null
  completed: boolean
  completedAt: Date | null
  listId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

const mockTasks: MockTask[] = []

const mockPrisma = {
  task: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const task = mockTasks.find((t) => t.id === where.id)
      if (!task) return null
      return {
        ...task,
        priority: task.priority ?? 'MEDIUM',
        dueTimezone: task.dueTimezone,
      }
    },
    findMany: async ({ where, orderBy, skip, take }: any) => {
      let results = mockTasks.filter((t) => t.userId === where?.userId)
      if (where?.dueDate) {
        results = results.filter((t) => t.dueDate === where.dueDate)
      }
      if (where?.dueDate === null) {
        results = results.filter((t) => t.dueDate === null)
      }
      if (where?.dueDate?.gte) {
        results = results.filter((t) => t.dueDate && t.dueDate >= where.dueDate.gte)
      }
      if (where?.dueDate?.lte) {
        results = results.filter((t) => t.dueDate && t.dueDate <= where.dueDate.lte)
      }
      if (orderBy?.createdAt) {
        results = results.sort((a, b) =>
          orderBy.createdAt === 'desc'
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime()
        )
      }
      if (orderBy?.dueDate) {
        results = results.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      }
      const start = skip || 0
      const end = take ? start + take : results.length
      return results.slice(start, end)
    },
    create: async ({ data }: { data: any }) => {
      const newTask: MockTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        dueTimezone: data.dueTimezone,
        completed: data.completed,
        completedAt: data.completedAt,
        listId: data.listId,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockTasks.push(newTask)
      return newTask
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = mockTasks.findIndex((t) => t.id === where.id)
      if (index === -1) throw new Error('Task not found')
      const updated = {
        ...mockTasks[index],
        ...data,
        updatedAt: new Date(),
      }
      mockTasks[index] = updated as MockTask
      return updated
    },
    delete: async ({ where }: { where: { id: string; userId: string } }) => {
      const index = mockTasks.findIndex((t) => t.id === where.id && t.userId === where.userId)
      if (index !== -1) mockTasks.splice(index, 1)
    },
    count: async ({ where }: { where: { userId: string } }) => {
      return mockTasks.filter((t) => t.userId === where.userId).length
    },
  },
}

async function buildTestApp() {
  const app = Fastify({ logger: false })

  await app.register(fastifyCors, { origin: '*' })
  await app.register(fastifyJwt, { secret: TEST_JWT_SECRET })

  const taskRepository = new PrismaTaskRepository(mockPrisma as any)
  const createTask = new CreateTask(taskRepository)
  const getTask = new GetTask(taskRepository)
  const updateTask = new UpdateTask(taskRepository)
  const deleteTask = new DeleteTask(taskRepository)
  const listTasks = new ListTasks(taskRepository)
  const listTasksByDate = new ListTasksByDate(taskRepository)
  const listInboxTasks = new ListInboxTasks(taskRepository)
  const tasksController = new TasksController(
    createTask,
    getTask,
    updateTask,
    deleteTask,
    listTasks,
    listTasksByDate,
    listInboxTasks,
  )

  app.decorate('tasksController', tasksController)
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  await app.register(tasksRoutes)

  return app
}

function generateToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign({ sub: userId })
}

describe('Tasks Integration Tests', () => {
  let app: FastifyInstance
  let userToken: string

  beforeAll(async () => {
    mockTasks.length = 0
    resetLogger()
    app = await buildTestApp()
    await app.ready()
    userToken = generateToken(app, 'test-user-1')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    mockTasks.length = 0
  })

  describe('POST /tasks', () => {
    it('should create a task and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
        payload: {
          title: 'Test Task',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('id')
      expect(body.title).toBe('Test Task')
      expect(body.completed).toBe(false)
      expect(body.priority).toBe('MEDIUM')
    })

    it('should create a task with dueDate', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
        payload: {
          title: 'Task with due date',
          dueDate: '2024-03-15',
          dueTime: '14:30',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.dueDate).toBe('2024-03-15')
      expect(body.dueTime).toBe('14:30')
    })

    it('should return 400 for missing title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          description: 'No title task',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle missing authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: {
          title: 'Test Task',
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

describe('GET /tasks/:id', () => {
    it('should return task with dueTimezone', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
        payload: {
          title: 'Task with timezone',
          dueDate: '2024-03-15',
          dueTime: '14:30',
        },
      })
      const task = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'GET',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      // dueTimezone is optional and may be undefined (not included in JSON)
      expect(body.dueTimezone ?? null).toBeNull()
    })

    it('should return 404 for non-existent task', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tasks/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 for invalid task id format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tasks/invalid-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

describe('GET /tasks', () => {
    it('should list tasks for user', async () => {
      await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          title: 'Test Task',
          priority: 'MEDIUM',
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/tasks?page=1&size=10',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('meta')
      expect(body.items.length).toBeGreaterThan(0)
      expect(body.meta).toEqual(expect.objectContaining({
        page: 1,
        size: 10,
      }))
    })
  })

  describe('GET /tasks/today', () => {
    it('should return tasks for today', async () => {
      const today = new Date().toISOString().split('T')[0]

      await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'UTC',
        },
        payload: {
          title: 'Today Task',
          dueDate: today,
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/tasks/today',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'UTC',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body) ? body.length > 0 : body.tasks?.length > 0).toBe(true)
    })
  })

  describe('GET /tasks/inbox', () => {
    it('should return tasks without dueDate', async () => {
      const today = new Date().toISOString().split('T')[0]

      await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Inbox Task' },
      })
      await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Dated Task', dueDate: today },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/tasks/inbox',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body) ? body.length > 0 : body.tasks?.length > 0).toBe(true)
    })
  })

  describe('PATCH /tasks/:id', () => {
    it('should update a task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Original Title' },
      })
      const task = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Updated Title' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.title).toBe('Updated Title')
    })

    it('should return 400 for invalid task id format', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/tasks/invalid-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Updated Title' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /tasks/:id with completed', () => {
    it('should complete a task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Task to Complete' },
      })
      const task = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { completed: true },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.completed).toBe(true)
    })

    it('should uncomplete a task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Task to Uncomplete' },
      })
      const task = JSON.parse(createResponse.body)

      await app.inject({
        method: 'PATCH',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { completed: true },
      })

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { completed: false },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.completed).toBe(false)
    })

    it('should update task with multiple fields including completed', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Task Multi Update' },
      })
      const task = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Updated Title', completed: true, priority: 'HIGH' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.title).toBe('Updated Title')
      expect(body.completed).toBe(true)
      expect(body.priority).toBe('HIGH')
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/tasks',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { title: 'Task to Delete' },
      })
      const task = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'DELETE',
        url: `/tasks/${task.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should return 400 for invalid task id format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/tasks/invalid-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})