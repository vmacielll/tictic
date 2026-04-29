import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { StartPomodoro } from '@modules/pomodoro/application/use-cases/StartPomodoro'
import { CompletePomodoro } from '@modules/pomodoro/application/use-cases/CompletePomodoro'
import { CancelPomodoro } from '@modules/pomodoro/application/use-cases/CancelPomodoro'
import { ListPomodoros } from '@modules/pomodoro/application/use-cases/ListPomodoros'
import { GetActivePomodoro } from '@modules/pomodoro/application/use-cases/GetActivePomodoro'
import { PrismaPomodoroRepository } from '@modules/pomodoro/infra/repositories/PrismaPomodoroRepository'
import { PomodoroController } from '@modules/pomodoro/http/PomodoroController'
import { pomodoroRoutes } from '@modules/pomodoro/http/pomodoro.routes'

const TEST_JWT_SECRET = 'test-secret-key-for-integration-tests'

interface MockPomodoro {
  id: string
  userId: string
  taskId: string | null
  duration: number
  startedAt: Date
  status: string
  completedAt: Date | null
}

const mockPomodoros: MockPomodoro[] = []

const mockPrisma = {
  pomodoroSession: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockPomodoros.find((p) => p.id === where.id) || null
    },
    findMany: async ({ where, orderBy }: any) => {
      let results = mockPomodoros.filter((p) => p.userId === where?.userId)
      if (where?.status) {
        results = results.filter((p) => p.status === where.status)
      }
      return results
    },
    findFirst: async ({ where }: any) => {
      return mockPomodoros.find((p) => p.userId === where?.userId && p.status === 'RUNNING') || null
    },
    create: async ({ data }: { data: any }) => {
      const newSession: MockPomodoro = {
        id: data.id,
        userId: data.userId,
        taskId: data.taskId,
        duration: data.duration,
        startedAt: data.startedAt,
        status: data.status,
        completedAt: data.completedAt,
      }
      mockPomodoros.push(newSession)
      return newSession
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = mockPomodoros.findIndex((p) => p.id === where.id)
      if (index === -1) throw new Error('Session not found')
      const updated = {
        ...mockPomodoros[index],
        ...data,
      }
      mockPomodoros[index] = updated as MockPomodoro
      return updated
    },
  },
}

async function buildTestApp() {
  const app = Fastify({ logger: false })

  await app.register(fastifyCors, { origin: '*' })
  await app.register(fastifyJwt, { secret: TEST_JWT_SECRET })

  const pomodoroRepository = new PrismaPomodoroRepository(mockPrisma as any)
  const startPomodoro = new StartPomodoro(pomodoroRepository)
  const completePomodoro = new CompletePomodoro(pomodoroRepository)
  const cancelPomodoro = new CancelPomodoro(pomodoroRepository)
  const listPomodoros = new ListPomodoros(pomodoroRepository)
  const getActivePomodoro = new GetActivePomodoro(pomodoroRepository)
  const pomodoroController = new PomodoroController(
    startPomodoro,
    completePomodoro,
    cancelPomodoro,
    listPomodoros,
    getActivePomodoro,
  )

  app.decorate('pomodoroController', pomodoroController)
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  await app.register(pomodoroRoutes)

  return app
}

function generateToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign({ sub: userId })
}

describe('Pomodoro Integration Tests', () => {
  let app: FastifyInstance
  let userToken: string

  beforeAll(async () => {
    mockPomodoros.length = 0
    app = await buildTestApp()
    await app.ready()
    userToken = generateToken(app, 'test-user-1')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    mockPomodoros.length = 0
  })

  describe('POST /pomodoro', () => {
    it('should start a pomodoro and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          duration: 25,
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should start a pomodoro with taskId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          duration: 25,
          taskId: crypto.randomUUID(),
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should return 400 for invalid duration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          duration: -5,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /pomodoro/active', () => {
    it('should return active pomodoro if exists', async () => {
      await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { duration: 25 },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/pomodoro/active',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return empty when no active pomodoro', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/pomodoro/active',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('GET /pomodoro', () => {
    it('should list pomodoro sessions', async () => {
      await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { duration: 25 },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('PATCH /pomodoro/:id/complete', () => {
    it('should complete a pomodoro', async () => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { duration: 25 },
      })
      const session = JSON.parse(startResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/pomodoro/${session.id}/complete`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 400 for invalid id format', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/pomodoro/invalid-id/complete',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /pomodoro/:id/cancel', () => {
    it('should cancel a pomodoro', async () => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/pomodoro',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { duration: 25 },
      })
      const session = JSON.parse(startResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/pomodoro/${session.id}/cancel`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return 400 for invalid id format', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/pomodoro/invalid-id/cancel',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})