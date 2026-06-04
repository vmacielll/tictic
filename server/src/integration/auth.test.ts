import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { RegisterUser } from '@modules/auth/application/use-cases/RegisterUser'
import { LoginUser } from '@modules/auth/application/use-cases/LoginUser'
import { PrismaUserRepository } from '@modules/auth/infra/repositories/PrismaUserRepository'
import { AuthController } from '@modules/auth/http/AuthController'
import { authRoutes } from '@modules/auth/http/auth.routes'
import { resetLogger } from '@shared/utils/logger'
import { createTestApp } from '../__tests__/utils/testAppFactory'

interface MockUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

const mockUsers: MockUser[] = []

const mockPrisma = {
  user: {
    findUnique: async ({ where }: { where: { email: string } }) => {
      return mockUsers.find((u) => u.email === where.email) || null
    },
    create: async ({ data }: { data: { id: string; name: string; email: string; passwordHash: string } }) => {
      const newUser: MockUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUsers.push(newUser)
      return newUser
    },
  },
}

const _mockPassword = {
  hash: async (password: string) => `hashed_${password}`,
  compare: async (password: string, hash: string) => password === hash.replace('hashed_', ''),
}

async function buildTestApp() {
  const { app, generateToken } = await createTestApp()

  const userRepository = new PrismaUserRepository(mockPrisma as any)
  const registerUser = new RegisterUser(userRepository)
  const loginUser = new LoginUser(userRepository, app)
  const authController = new AuthController(registerUser, loginUser)

  app.decorate('authController', authController)

  await app.register(authRoutes)

  return { app, generateToken }
}

describe('Auth Integration Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    mockUsers.length = 0
    resetLogger()
    const result = await buildTestApp()
    app = result.app
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    mockUsers.length = 0
  })

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('id')
      expect(body.email).toBe('test@example.com')
    })

    it('should return 400 for invalid payload (missing name)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid payload (invalid email)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'test2@example.com',
          password: '123',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /auth/login', () => {
    it('should return 400 for invalid payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for wrong password', async () => {
      mockUsers.push({
        id: 'login-user-id',
        name: 'Login User',
        email: 'login@example.com',
        passwordHash: 'hashed_correctpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'wrongpassword',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVALID_CREDENTIALS')
    })
  })
})