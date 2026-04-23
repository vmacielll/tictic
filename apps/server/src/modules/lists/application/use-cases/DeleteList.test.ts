import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type IListRepository } from '../../domain/repositories/IListRepository'
import { DeleteList } from './DeleteList'
import { List } from '../../domain/entities/List'
import { AppError } from '@shared/errors/AppError'

describe('DeleteList', () => {
  let mockListRepository: IListRepository
  let useCase: DeleteList

  beforeEach(() => {
    mockListRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new DeleteList(mockListRepository)
  })

  it('should delete a list successfully', async () => {
    const list = List.create('user-1', 'My List')

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'delete').mockResolvedValue()

    await useCase.execute({ listId: list.id, userId: 'user-1' })

    expect(mockListRepository.delete).toHaveBeenCalledWith(list.id, 'user-1')
  })

  it('should throw AppError when list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ listId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 404 when list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)

    try {
      await useCase.execute({ listId: 'non-existent', userId: 'user-1' })
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
      useCase.execute({ listId: list.id, userId: 'user-2' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 403 when user is not the owner', async () => {
    const list = List.create('user-1', 'My List')
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)

    try {
      await useCase.execute({ listId: list.id, userId: 'user-2' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(403)
      expect((error as AppError).code).toBe('FORBIDDEN')
    }
  })

  it('should call delete with correct parameters', async () => {
    const list = List.create('user-1', 'My List')
    const deleteSpy = vi.spyOn(mockListRepository, 'delete').mockResolvedValue()

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)

    await useCase.execute({ listId: list.id, userId: 'user-1' })

    expect(deleteSpy).toHaveBeenCalledWith(list.id, 'user-1')
  })

  it('should throw when repository delete fails', async () => {
    const list = List.create('user-1', 'My List')

    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'delete').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ listId: list.id, userId: 'user-1' }),
    ).rejects.toThrow('Database error')
  })

  it('should call findById with correct parameters', async () => {
    const list = List.create('user-1', 'My List')
    const findByIdSpy = vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    vi.spyOn(mockListRepository, 'delete').mockResolvedValue()

    await useCase.execute({ listId: list.id, userId: 'user-1' })

    expect(findByIdSpy).toHaveBeenCalledWith(list.id, 'user-1')
  })

  it('should not call delete if list is not found', async () => {
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(null)
    const deleteSpy = vi.spyOn(mockListRepository, 'delete')

    await expect(
      useCase.execute({ listId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow()

    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('should not call delete if user is not the owner', async () => {
    const list = List.create('user-1', 'My List')
    vi.spyOn(mockListRepository, 'findById').mockResolvedValue(list)
    const deleteSpy = vi.spyOn(mockListRepository, 'delete')

    await expect(
      useCase.execute({ listId: list.id, userId: 'user-2' }),
    ).rejects.toThrow()

    expect(deleteSpy).not.toHaveBeenCalled()
  })
})