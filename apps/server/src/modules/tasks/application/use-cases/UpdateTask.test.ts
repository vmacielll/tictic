import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { UpdateTask } from './UpdateTask'
import { Task } from '../../domain/entities/Task'
import { AppError } from '@shared/errors/AppError'
import type { Priority } from '../../domain/types/Priority'

describe('UpdateTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: UpdateTask

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
    useCase = new UpdateTask(mockTaskRepository)
  })

  it('should update a task title successfully', async () => {
    const task = Task.create('user-1', 'Old Title')
    const updatedTask = Task.create('user-1', 'New Title')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(updatedTask)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
      title: 'New Title',
    })

    expect(mockTaskRepository.save).toHaveBeenCalled()
  })

  it('should update a task description', async () => {
    const task = Task.create('user-1', 'Test Task')
    const updatedTask = Task.create('user-1', 'Test Task')
    ;(updatedTask as any)._description = 'New description'

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(updatedTask)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
      description: 'New description',
    })

    expect(result.description).toBe('New description')
  })

  it('should update a task priority', async () => {
    const task = Task.create('user-1', 'Test Task')
    const updatedTask = Task.create('user-1', 'Test Task')
    ;(updatedTask as any)._priority = 'HIGH' as Priority

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(updatedTask)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
      priority: 'HIGH' as Priority,
    })

    expect(result.priority).toBe('HIGH')
  })

  it('should throw AppError when task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ taskId: 'non-existent', userId: 'user-1', title: 'New Title' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 404 when task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)

    try {
      await useCase.execute({ taskId: 'non-existent', userId: 'user-1', title: 'New Title' })
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
      useCase.execute({ taskId: task.id, userId: 'user-2', title: 'New Title' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError with 403 when user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    try {
      await useCase.execute({ taskId: task.id, userId: 'user-2', title: 'New Title' })
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(403)
      expect((error as AppError).code).toBe('FORBIDDEN')
    }
  })

  it('should throw AppError when repository save fails', async () => {
    const task = Task.create('user-1', 'Test Task')
    const saveError = new Error('Database connection failed')

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockRejectedValue(saveError)

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-1', title: 'New Title' }),
    ).rejects.toThrow('Database connection failed')
  })

  it('should call findById with the correct taskId and userId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const findByIdSpy = vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1', title: 'New Title' })

    expect(findByIdSpy).toHaveBeenCalledWith(task.id, 'user-1')
  })

  it('should not call save if task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)
    const saveSpy = vi.spyOn(mockTaskRepository, 'save')

    await expect(
      useCase.execute({ taskId: 'non-existent', userId: 'user-1', title: 'New Title' }),
    ).rejects.toThrow()

    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('should not call save if user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    const saveSpy = vi.spyOn(mockTaskRepository, 'save')

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-2', title: 'New Title' }),
    ).rejects.toThrow()

    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('should update dueDate', async () => {
    const task = Task.create('user-1', 'Test Task')
    const dueDate = new Date('2024-12-31')
    const updatedTask = Task.create('user-1', 'Test Task')
    ;(updatedTask as any)._dueDate = dueDate

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(updatedTask)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
      dueDate,
    })

    expect(result.dueDate).toEqual(dueDate)
  })

  it('should update listId', async () => {
    const task = Task.create('user-1', 'Test Task')
    const updatedTask = Task.create('user-1', 'Test Task')
    ;(updatedTask as any)._listId = 'list-1'

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(updatedTask)

    const result = await useCase.execute({
      taskId: task.id,
      userId: 'user-1',
      listId: 'list-1',
    })

    expect(result.listId).toBe('list-1')
  })
})