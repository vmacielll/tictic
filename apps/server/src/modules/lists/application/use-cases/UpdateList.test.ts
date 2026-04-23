import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type IListRepository } from '../../domain/repositories/IListRepository'
import { UpdateList } from './UpdateList'
import { List } from '../../domain/entities/List'
import { AppError } from '@shared/errors/AppError'

describe('UpdateList', () => {
  let mockListRepository: IListRepository
  let useCase: UpdateList

  beforeEach(() => {
    mockListRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new UpdateList(mockListRepository)
  })

  it('should update a list name successfully', async () => {
    const list = List.create('user-1', 'Old Name')
    const updatedList = List.create('user-1', 'New Name')

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'save').mockResolvedValue(updatedList)

    const result = await useCase.execute({
      listId: list.id,
      userId: 'user-1',
      name: 'New Name',
    })

    expect(mockListRepository.save).toHaveBeenCalled()
  })

  it('should update a list color', async () => {
    const list = List.create('user-1', 'My List')
    const updatedList = List.create('user-1', 'My List')
    updatedList.updateColor('#FF0000')

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'save').mockResolvedValue(updatedList)

    const result = await useCase.execute({
      listId: list.id,
      userId: 'user-1',
      color: '#FF0000',
    })

    expect(result.color).toBe('#FF0000')
  })

  it('should throw AppError when list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ listId: 'non-existent', userId: 'user-1', name: 'New Name' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 404 when list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)

    try {
      await useCase.execute({ listId: 'non-existent', userId: 'user-1', name: 'New Name' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(404)
      expect((error as AppError).code).toBe('LIST_NOT_FOUND')
    }
  })

  it('should throw AppError when user is not the owner', async () => {
    const list = List.create('user-1', 'My List')
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)

    await expect(
      useCase.execute({ listId: list.id, userId: 'user-2', name: 'New Name' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 403 when user is not the owner', async () => {
    const list = List.create('user-1', 'My List')
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)

    try {
      await useCase.execute({ listId: list.id, userId: 'user-2', name: 'New Name' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(403)
      expect((error as AppError).code).toBe('FORBIDDEN')
    }
  })

  it('should call findById with correct parameters', async () => {
    const list = List.create('user-1', 'My List')
    const findByIdSpy = vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'save').mockResolvedValue(list)

    await useCase.execute({ listId: list.id, userId: 'user-1', name: 'New Name' })

    expect(findByIdSpy).toHaveBeenCalledWith(list.id, 'user-1')
  })

  it('should throw when repository save fails', async () => {
    const list = List.create('user-1', 'My List')

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'save').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ listId: list.id, userId: 'user-1', name: 'New Name' }),
    ).rejects.toThrow('Database error')
  })

  it('should not call save if list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)
    const saveSpy = vi.spyOn(mockListRepository, 'save')

    await expect(
      useCase.execute({ listId: 'non-existent', userId: 'user-1', name: 'New Name' }),
    ).rejects.toThrow()

    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('should not call save if user is not the owner', async () => {
    const list = List.create('user-1', 'My List')
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    const saveSpy = vi.spyOn(mockListRepository, 'save')

    await expect(
      useCase.execute({ listId: list.id, userId: 'user-2', name: 'New Name' }),
    ).rejects.toThrow()

    expect(saveSpy).not.toHaveBeenCalled()
  })
})