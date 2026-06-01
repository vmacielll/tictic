import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type IListRepository } from '../../domain/repositories/IListRepository'
import { ListUserLists } from './ListUserLists'
import { List } from '../../domain/entities/List'

describe('ListUserLists', () => {
  let mockListRepository: IListRepository
  let useCase: ListUserLists

  beforeEach(() => {
    mockListRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new ListUserLists(mockListRepository)
  })

  it('should list all lists for a user', async () => {
    const list1 = List.create('user-1', 'List 1')
    const list2 = List.create('user-1', 'List 2')

    vi.spyOn(mockListRepository, 'findByUserId').mockResolvedValue([
      Object.assign(list1, { taskCount: 0 }),
      Object.assign(list2, { taskCount: 0 }),
    ])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('List 1')
    expect(result[0].taskCount).toBe(0)
    expect(result[1].name).toBe('List 2')
    expect(result[1].taskCount).toBe(0)
  })

  it('should return empty list when user has no lists', async () => {
    vi.spyOn(mockListRepository, 'findByUserId').mockResolvedValue([])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result).toHaveLength(0)
  })

  it('should call repository with correct userId', async () => {
    const list = List.create('user-1', 'List 1')
    const findByUserIdSpy = vi.spyOn(mockListRepository, 'findByUserId').mockResolvedValue([Object.assign(list, { taskCount: 0 })])

    await useCase.execute({ userId: 'user-1' })

    expect(findByUserIdSpy).toHaveBeenCalledWith('user-1')
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockListRepository, 'findByUserId').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ userId: 'user-1' }),
    ).rejects.toThrow('Database error')
  })

  it('should map lists to response format', async () => {
    const list = List.create('user-1', 'My List', '#FF0000')

    vi.spyOn(mockListRepository, 'findByUserId').mockResolvedValue([Object.assign(list, { taskCount: 5 })])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result[0].id).toBe(list.id)
    expect(result[0].name).toBe('My List')
    expect(result[0].color).toBe('#FF0000')
    expect(result[0].userId).toBe('user-1')
    expect(result[0].taskCount).toBe(5)
  })
})