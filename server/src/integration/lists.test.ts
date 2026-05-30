import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { type FastifyInstance } from 'fastify'
import { CreateList } from '@modules/lists/application/use-cases/CreateList'
import { UpdateList } from '@modules/lists/application/use-cases/UpdateList'
import { DeleteList } from '@modules/lists/application/use-cases/DeleteList'
import { ListUserLists } from '@modules/lists/application/use-cases/ListUserLists'
import { ListTasksByList } from '@modules/tasks/application/use-cases/ListTasksByList'
import { PrismaListRepository } from '@modules/lists/infra/repositories/PrismaListRepository'
import { PrismaTaskRepository } from '@modules/tasks/infra/repositories/PrismaTaskRepository'
import { ListsController } from '@modules/lists/http/ListsController'
import { listsRoutes } from '@modules/lists/http/lists.routes'
import { createTestApp } from '../__tests__/utils/testAppFactory'

interface MockList {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

const mockLists: MockList[] = []

const mockPrisma = {
  list: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockLists.find((l) => l.id === where.id) || null
    },
    findMany: async ({ where, orderBy }: any) => {
      let results = mockLists.filter((l) => l.userId === where?.userId)
      if (orderBy?.createdAt) {
        results = results.sort((a, b) =>
          orderBy.createdAt === 'desc'
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime()
        )
      }
      return results.map((list) => ({ ...list, _count: { tasks: 0 } }))
    },
    create: async ({ data }: { data: any }) => {
      const newList: MockList = {
        id: data.id,
        name: data.name,
        color: data.color,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockLists.push(newList)
      return newList
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = mockLists.findIndex((l) => l.id === where.id)
      if (index === -1) throw new Error('List not found')
      const updated = {
        ...mockLists[index],
        ...data,
        updatedAt: new Date(),
      }
      mockLists[index] = updated as MockList
      return updated
    },
    delete: async ({ where }: { where: { id: string; userId: string } }) => {
      const index = mockLists.findIndex((l) => l.id === where.id && l.userId === where.userId)
      if (index !== -1) mockLists.splice(index, 1)
    },
  },
  task: {
    findMany: async () => [],
    count: async () => 0,
  },
}

async function buildTestApp() {
  const { app, generateToken } = await createTestApp()

  const listRepository = new PrismaListRepository(mockPrisma as any)
  const taskRepository = new PrismaTaskRepository(mockPrisma as any)
  const createList = new CreateList(listRepository)
  const updateList = new UpdateList(listRepository)
  const deleteList = new DeleteList(listRepository)
  const listUserLists = new ListUserLists(listRepository)
  const listTasksByList = new ListTasksByList(taskRepository)
  const listsController = new ListsController(createList, updateList, deleteList, listUserLists, listTasksByList)

  app.decorate('listsController', listsController)

  await app.register(listsRoutes)

  return { app, generateToken }
}

describe('Lists Integration Tests', () => {
  let app: FastifyInstance
  let userToken: string

  beforeAll(async () => {
    mockLists.length = 0
    const result = await buildTestApp()
    app = result.app
    await app.ready()
    userToken = result.generateToken(app, 'test-user-1')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    mockLists.length = 0
  })

  describe('POST /lists', () => {
    it('should create a list and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          name: 'My List',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('id')
      expect(body.name).toBe('My List')
    })

    it('should create a list with color', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          name: 'Colored List',
          color: '#dc2626',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.color).toBe('#dc2626')
    })

    it('should return 400 for missing name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          color: '#dc2626',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /lists', () => {
    it('should list user lists', async () => {
      await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'List 1' },
      })
      await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'List 2' },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body) ? body.length : body.lists?.length).toBeGreaterThan(0)
    })

    it('should return empty for user with no lists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('PATCH /lists/:id', () => {
    it('should update a list', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'Original Name' },
      })
      const list = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'PATCH',
        url: `/lists/${list.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'Updated Name' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Updated Name')
    })

    it('should return 400 for invalid list id', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/lists/invalid-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'Updated Name' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /lists/:id', () => {
    it('should delete a list', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/lists',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: { name: 'List to Delete' },
      })
      const list = JSON.parse(createResponse.body)

      const response = await app.inject({
        method: 'DELETE',
        url: `/lists/${list.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should return 400 for invalid list id', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/lists/invalid-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})