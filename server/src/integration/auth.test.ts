import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { RegisterUser } from '@modules/auth/application/use-cases/RegisterUser'
import { LoginUser } from '@modules/auth/application/use-cases/LoginUser'
import { RefreshToken } from '@modules/auth/application/use-cases/RefreshToken'
import { UpdateProfile } from '@modules/auth/application/use-cases/UpdateProfile'
import { ChangePassword } from '@modules/auth/application/use-cases/ChangePassword'
import { DeleteAccount } from '@modules/auth/application/use-cases/DeleteAccount'
import { PrismaUserRepository } from '@modules/auth/infra/repositories/PrismaUserRepository'
import { PrismaRefreshTokenRepository } from '@modules/auth/infra/repositories/PrismaRefreshTokenRepository'
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
  $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
  user: {
    findUnique: async ({ where }: { where: { email: string } }) => {
      return mockUsers.find((u) => u.email === where.email) || null
    },
    findFirst: async ({ where }: { where: { email?: string; id?: string; deletedAt: null } }) => {
      const match = mockUsers.find((u) => {
        if (where.email && u.email !== where.email) return false
        if (where.id && u.id !== where.id) return false
        return true
      })
      return match || null
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
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const idx = mockUsers.findIndex((u) => u.id === where.id)
      if (idx === -1) return null
      Object.assign(mockUsers[idx], data, { updatedAt: new Date() })
      return mockUsers[idx]
    },
  },
  refreshToken: {
    updateMany: async () => ({ count: 0 }),
  },
}

const _mockPassword = {
  hash: async (password: string) => `hashed_${password}`,
  compare: async (password: string, hash: string) => password === hash.replace('hashed_', ''),
}

async function buildTestApp() {
  const { app, generateToken } = await createTestApp()

  const userRepository = new PrismaUserRepository(mockPrisma as any)
  const refreshTokenRepository = new PrismaRefreshTokenRepository(mockPrisma as any)

  const registerUser = new RegisterUser(userRepository)
  const loginUser = new LoginUser(
    userRepository,
    refreshTokenRepository,
    (payload: object, options?: object) => app.jwt.sign(payload, options),
  )
  const refreshToken = new RefreshToken(
    refreshTokenRepository,
    (payload: object, options?: object) => app.jwt.sign(payload, options),
    (token: string) => app.jwt.verify(token) as { sub: string },
    mockPrisma as any,
  )
  const updateProfile = new UpdateProfile(userRepository)
  const changePassword = new ChangePassword(userRepository)
  const deleteAccount = new DeleteAccount(userRepository)

  const authController = new AuthController(
    registerUser,
    loginUser,
    refreshToken,
    updateProfile,
    changePassword,
    deleteAccount,
    userRepository,
    refreshTokenRepository,
  )

  app.decorate('authController', authController)

  await app.register(authRoutes)

  return { app, generateToken }
}

describe('Auth Integration Tests', () => {
  let app: FastifyInstance
  let generateToken: (app: FastifyInstance, userId: string) => string

  beforeAll(async () => {
    mockUsers.length = 0
    resetLogger()
    const result = await buildTestApp()
    app = result.app
    generateToken = result.generateToken
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

  describe('PATCH /auth/profile', () => {
    it('returns 401 without token', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/auth/profile',
        payload: { name: 'New Name' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('updates name and returns 200 with updated profile', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Original Name',
          email: 'profile-test@example.com',
          password: 'password123',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'PATCH',
        url: '/auth/profile',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Updated Name' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Updated Name')
    })

    it('returns 400 for invalid name (empty or too short)', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Test User',
          email: 'profile-invalid@example.com',
          password: 'password123',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'PATCH',
        url: '/auth/profile',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'A' },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /auth/change-password', () => {
    it('returns 401 without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        payload: { currentPassword: 'old', newPassword: 'newpassword123' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('changes password and returns 200', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Password User',
          email: 'change-pw@example.com',
          password: 'oldpassword123',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: 'oldpassword123', newPassword: 'newpassword123' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Password changed successfully')
    })

    it('returns 401 for wrong current password', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Password User 2',
          email: 'change-pw-wrong@example.com',
          password: 'correctpassword',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/change-password',
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: 'wrongpassword', newPassword: 'newpassword123' },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVALID_PASSWORD')
    })
  })

  describe('DELETE /auth/account', () => {
    it('returns 401 without token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/account',
        payload: { password: 'somepassword' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deletes account and returns 200', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Delete User',
          email: 'delete-test@example.com',
          password: 'password123',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/account',
        headers: { authorization: `Bearer ${token}` },
        payload: { password: 'password123' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Account deleted successfully')
    })

    it('returns 401 for wrong password', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Delete User 2',
          email: 'delete-wrong-pw@example.com',
          password: 'correctpassword',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/account',
        headers: { authorization: `Bearer ${token}` },
        payload: { password: 'wrongpassword' },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVALID_PASSWORD')
    })

    it('after deletion, login with same email returns 401', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Delete User 3',
          email: 'delete-login-test@example.com',
          password: 'password123',
        },
      })

      const { id } = JSON.parse(registerRes.body)
      const token = generateToken(app, id)

      await app.inject({
        method: 'DELETE',
        url: '/auth/account',
        headers: { authorization: `Bearer ${token}` },
        payload: { password: 'password123' },
      })

      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'delete-login-test@example.com',
          password: 'password123',
        },
      })

      expect(loginRes.statusCode).toBe(401)
      const body = JSON.parse(loginRes.body)
      expect(body.code).toBe('INVALID_CREDENTIALS')
    })
  })
})