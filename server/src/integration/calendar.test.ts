import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { GetCalendarMonth } from '@modules/calendar/application/use-cases/GetCalendarMonth'
import { GetCalendarWeek } from '@modules/calendar/application/use-cases/GetCalendarWeek'
import { GetCalendarDay } from '@modules/calendar/application/use-cases/GetCalendarDay'
import { PrismaTaskRepository } from '@modules/tasks/infra/repositories/PrismaTaskRepository'
import { CalendarController } from '@modules/calendar/http/CalendarController'
import { calendarRoutes } from '@modules/calendar/http/calendar.routes'

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
      return mockTasks.find((t) => t.id === where.id) || null
    },
    findMany: async ({ where, orderBy }: any) => {
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
      return results
    },
  },
}

async function buildTestApp() {
  const app = Fastify({ logger: false })

  await app.register(fastifyCors, { origin: '*' })
  await app.register(fastifyJwt, { secret: TEST_JWT_SECRET })

  const taskRepository = new PrismaTaskRepository(mockPrisma as any)
  const getCalendarMonth = new GetCalendarMonth(taskRepository)
  const getCalendarWeek = new GetCalendarWeek(taskRepository)
  const getCalendarDay = new GetCalendarDay(taskRepository)
  const calendarController = new CalendarController(getCalendarMonth, getCalendarWeek, getCalendarDay)

  app.decorate('calendarController', calendarController)
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  await app.register(calendarRoutes)

  return app
}

function generateToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign({ sub: userId })
}

describe('Calendar Integration Tests', () => {
  let app: FastifyInstance
  let userToken: string

  beforeAll(async () => {
    mockTasks.length = 0
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

  describe('GET /calendar/month', () => {
    it('should return month calendar data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/month?month=3&year=2024',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 400 for invalid month', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/month?month=13&year=2024',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /calendar/week', () => {
    it('should return week calendar data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/week?date=2024-03-15',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 400 for invalid date format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/week?date=invalid',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /calendar/day', () => {
    it('should return day calendar data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/day?date=2024-03-15',
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-timezone': 'America/Sao_Paulo',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 400 for invalid date format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/calendar/day?date=15-03-2024',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})