import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { DeleteTask } from './DeleteTask'
import { Task } from '../../domain/entities/Task'
import { AppError } from '@shared/errors/AppError'

describe('DeleteTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: DeleteTask

  beforeEach(() => {
    mockTaskRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndDate: vi.fn(),
      findByUserIdAndDateRange: vi.fn(),
      findInboxByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
    }
    useCase = new DeleteTask(mockTaskRepository)
  })

  it('should delete a task successfully', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'delete').mockResolvedValue()

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(mockTaskRepository.delete).toHaveBeenCalledWith(task.id, 'user-1')
  })

  it('should throw AppError when task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ taskId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 404 when task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)

    try {
      await useCase.execute({ taskId: 'non-existent', userId: 'user-1' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(404)
      expect((error as AppError).code).toBe('TASK_NOT_FOUND')
    }
  })

  it('should throw AppError when user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-2' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 403 when user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    try {
      await useCase.execute({ taskId: task.id, userId: 'user-2' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(403)
      expect((error as AppError).code).toBe('FORBIDDEN')
    }
  })

  it('should call delete with the correct taskId and userId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const deleteSpy = vi.spyOn(mockTaskRepository, 'delete').mockResolvedValue()

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(deleteSpy).toHaveBeenCalledWith(task.id, 'user-1')
  })

  it('should throw AppError when repository delete fails', async () => {
    const task = Task.create('user-1', 'Test Task')
    const deleteError = new Error('Database connection failed')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'delete').mockRejectedValue(deleteError)

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-1' }),
    ).rejects.toThrow('Database connection failed')

    expect(mockTaskRepository.delete).toHaveBeenCalledWith(task.id, 'user-1')
  })

  it('should call findById with the correct taskId and userId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const findByIdSpy = vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'delete').mockResolvedValue()

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(findByIdSpy).toHaveBeenCalledWith(task.id, 'user-1')
  })

  it('should not call delete if task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)
    const deleteSpy = vi.spyOn(mockTaskRepository, 'delete')

    await expect(
      useCase.execute({ taskId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow()

    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('should not call delete if user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    const deleteSpy = vi.spyOn(mockTaskRepository, 'delete')

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-2' }),
    ).rejects.toThrow()

    expect(deleteSpy).not.toHaveBeenCalled()
  })
})