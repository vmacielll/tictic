import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { GetTask } from './GetTask'
import { Task } from '../../domain/entities/Task'
import { AppError } from '@shared/errors/AppError'

describe('GetTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: GetTask

  beforeEach(() => {
    mockTaskRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndDate: vi.fn(),
      findByUserIdAndDateRange: vi.fn(),
      findInboxByUserId: vi.fn(),
      findDueDate: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
    }
    useCase = new GetTask(mockTaskRepository)
  })

  it('should return task with dueTimezone when found', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.update(undefined, undefined, undefined, undefined, undefined, 'America/Sao_Paulo')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
    })

    expect(result.id).toBe(task.id)
    expect(result.title).toBe('Test Task')
    expect(result.dueTimezone).toBe('America/Sao_Paulo')
  })

  it('should return task with all fields', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.update(undefined, 'Test description', 'HIGH', '2024-12-31', '14:30:00', 'UTC')
    ;(task as any)._completed = true
    ;(task as any)._listId = 'list-1'

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
    })

    expect(result.description).toBe('Test description')
    expect(result.priority).toBe('HIGH')
    expect(result.dueDate).toBe('2024-12-31')
    expect(result.dueTime).toBe('14:30:00')
    expect(result.dueTimezone).toBe('UTC')
    expect(result.completed).toBe(true)
    expect(result.listId).toBe('list-1')
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

  it('should return null for dueTimezone when task has no timezone', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
    })

    expect(result.dueTimezone).toBeNull()
  })

  it('should call findById with the correct taskId and userId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const findByIdSpy = vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(findByIdSpy).toHaveBeenCalledWith(task.id, 'user-1')
  })
})