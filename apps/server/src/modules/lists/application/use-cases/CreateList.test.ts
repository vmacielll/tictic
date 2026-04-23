import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type IListRepository } from '../../domain/repositories/IListRepository'
import { CreateList } from './CreateList'
import { List } from '../../domain/entities/List'

describe('CreateList', () => {
  let mockListRepository: IListRepository
  let useCase: CreateList

  beforeEach(() => {
    mockListRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new CreateList(mockListRepository)
  })

  it('should create a list successfully', async () => {
    const list = List.create('user-1', 'My List')

    vi.spyOn(mockListRepository, 'create').mockResolvedValue(list)

    const result = await useCase.execute({ userId: 'user-1', name: 'My List' })

    expect(result.name).toBe('My List')
    expect(result.userId).toBe('user-1')
    expect(mockListRepository.create).toHaveBeenCalled()
  })

  it('should create a list with color', async () => {
    const list = List.create('user-1', 'My List', '#FF0000')

    vi.spyOn(mockListRepository, 'create').mockResolvedValue(list)

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'My List',
      color: '#FF0000',
    })

    expect(result.color).toBe('#FF0000')
  })

  it('should call repository create with correct data', async () => {
    const list = List.create('user-1', 'My List')
    const createSpy = vi.spyOn(mockListRepository, 'create').mockResolvedValue(list)

    await useCase.execute({ userId: 'user-1', name: 'My List' })

    expect(createSpy).toHaveBeenCalled()
    const callArgs = createSpy.mock.calls[0][0]
    expect(callArgs.userId).toBe('user-1')
    expect(callArgs.name).toBe('My List')
  })

  it('should throw when repository create fails', async () => {
    vi.spyOn(mockListRepository, 'create').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ userId: 'user-1', name: 'My List' }),
    ).rejects.toThrow('Database error')
  })
})