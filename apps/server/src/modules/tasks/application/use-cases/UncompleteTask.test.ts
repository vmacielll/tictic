import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { UncompleteTask } from './UncompleteTask'
import { Task } from '../../domain/entities/Task'
import { AppError } from '../../../../shared/errors/AppError'

describe('UncompleteTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: UncompleteTask

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
    useCase = new UncompleteTask(mockTaskRepository)
  })

  it('should uncomplete a task successfully', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.complete() // First complete it

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    const result = await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(result.completed).toBe(false)
    expect(result.completedAt).toBeUndefined()
    expect(result.id).toBe(task.id)
  })

  it('should throw AppError when task is not found', async () => {
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ taskId: 'non-existent', userId: 'user-1' }),
    ).rejects.toThrow(AppError)
  })

  it('should throw AppError when user is not the owner', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.complete() // First complete it
    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)

    await expect(
      useCase.execute({ taskId: task.id, userId: 'user-2' }),
    ).rejects.toThrow(AppError)
  })

  it('should handle uncompleting an already uncompleted task (idempotent)', async () => {
    const task = Task.create('user-1', 'Test Task')
    // Task is already uncompleted (completed = false)

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    const result = await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(result.completed).toBe(false)
    expect(result.completedAt).toBeUndefined()
    expect(mockTaskRepository.save).toHaveBeenCalledWith(task)
  })

  it('should return the updated task from repository after save', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.complete() // First complete it
    
    const savedTask = Task.create('user-1', 'Test Task')
    ;(savedTask as any)._completed = false
    ;(savedTask as any)._completedAt = undefined
    ;(savedTask as any)._updatedAt = new Date()

    vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(savedTask)

    const result = await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(result.completed).toBe(false)
    expect(result.completedAt).toBeUndefined()
    expect(result.updatedAt).toEqual(savedTask.updatedAt)
  })

  it('should throw AppError when repository save fails', async () => {
    const task = Task.create('user-1', 'Test Task')
    task.complete() // First complete it
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
    task.complete() // First complete it
    const findByIdSpy = vi.spyOn(mockTaskRepository, 'findById').mockResolvedValue(task)
    vi.spyOn(mockTaskRepository, 'save').mockResolvedValue(task)

    await useCase.execute({ taskId: task.id, userId: 'user-1' })

    expect(findByIdSpy).toHaveBeenCalledWith(task.id)
  })
})
