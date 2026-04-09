import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { CompleteTask } from './CompleteTask'
import { Task } from '../../domain/entities/Task'
import { AppError } from '../../../../shared/errors/AppError'

describe('CompleteTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: CompleteTask

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
    }
    useCase = new CompleteTask(mockTaskRepository)
  })

  it('should complete a task successfully', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    const result = await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(result.completed).toBe(true)
    expect(result.completedAt).toBeDefined()
    expect(result.id).toBe(task.id)
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

  it('should call save with the completed task', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(mockTaskRepository.save).toHaveBeenCalledWith(task)
    expect(task.completed).toBe(true)
  })

  it('should handle completing an already completed task (idempotent)', async () => {
    const task = Task.create('user-1', 'Test Task')
    // Simulate already completed task
    const completedTask = Task.create('user-1', 'Test Task')
    ;(completedTask as any)._completed = true
    ;(completedTask as any)._completedAt = new Date()
    ;(completedTask as any)._updatedAt = new Date()

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(completedTask)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(completedTask)

    const result = await useCase.execute({ taskId: completedTask.id, userId: 'user-1' })

    expect(result.completed).toBe(true)
    expect(result.completedAt).toBeDefined()
    expect(mockTaskRepository.save).toHaveBeenCalledWith(completedTask)
  })

  it('should return the updated task from repository after save', async () => {
    const task = Task.create('user-1', 'Test Task')
    const savedTask = Task.create('user-1', 'Test Task')
    ;(savedTask as any)._completed = true
    ;(savedTask as any)._completedAt = new Date()
    ;(savedTask as any)._updatedAt = new Date()

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(savedTask)

    const result = await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(result.completed).toBe(true)
    expect(result.completedAt).toEqual(savedTask.completedAt)
    expect(result.updatedAt).toEqual(savedTask.updatedAt)
  })

  it('should throw AppError when repository save fails', async () => {
    const task = Task.create('user-1', 'Test Task')
    const saveError = new Error('Database connection failed')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockRejectedValue(saveError)

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-1' }),
    ).rejects.toThrow('Database connection failed')

    expect(mockTaskRepository.save).toHaveBeenCalledWith(task)
  })

  it('should call findById with the correct taskId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const findByIdSpy = vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(findByIdSpy).toHaveBeenCalledWith(task.id)
  })
})
