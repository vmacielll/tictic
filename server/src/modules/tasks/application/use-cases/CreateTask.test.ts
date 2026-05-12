import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { CreateTask } from './CreateTask'
import { Task } from '../../domain/entities/Task'
import type { Priority } from '../../domain/types/Priority'
import { testDate } from '../../../../__tests__/utils/dateUtils'
import { resetLogger } from '@shared/utils/logger'

describe('CreateTask', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: CreateTask

  beforeEach(() => {
    mockTaskRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndDate: vi.fn(),
      findByUserIdAndDateRange: vi.fn(),
      findByDueDate: vi.fn(),
      findInboxByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
    }
    useCase = new CreateTask(mockTaskRepository)
    resetLogger() // Reset logger for each test
  })

  it('should create a task successfully', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({ userId: 'user-1', title: 'Test Task', dueTimezone: 'UTC' })

    expect(result.title).toBe('Test Task')
    expect(result.userId).toBe('user-1')
    expect(result.completed).toBe(false)
    expect(mockTaskRepository.create).toHaveBeenCalled()
  })

  it('should create a task with description', async () => {
    const task = Task.create('user-1', 'Test Task', 'Task description')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({
      userId: 'user-1',
      title: 'Test Task',
      description: 'Task description',
      dueTimezone: 'UTC',
    })

    expect(result.description).toBe('Task description')
  })

  it('should create a task with priority', async () => {
    const task = Task.create('user-1', 'Test Task', undefined, 'HIGH' as Priority)

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({
      userId: 'user-1',
      title: 'Test Task',
      priority: 'HIGH' as Priority,
      dueTimezone: 'UTC',
    })

    expect(result.priority).toBe('HIGH')
  })

  it('should create a task with dueDate', async () => {
    const task = Task.create('user-1', 'Test Task', undefined, undefined, '2024-12-31')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({
      userId: 'user-1',
      title: 'Test Task',
      dueDate: '2024-12-31',
      dueTimezone: 'UTC',
    })

    expect(result.dueDate).toBe('2024-12-31')
  })

  it('should create a task with listId', async () => {
    const task = Task.create('user-1', 'Test Task', undefined, undefined, undefined, undefined, undefined, 'list-1')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({
      userId: 'user-1',
      title: 'Test Task',
      listId: 'list-1',
      dueTimezone: 'UTC',
    })

    expect(result.listId).toBe('list-1')
  })

  it('should call repository create with correct data', async () => {
    const task = Task.create('user-1', 'Test Task')
    const createSpy = vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    await useCase.execute({ userId: 'user-1', title: 'Test Task' })

    expect(createSpy).toHaveBeenCalled()
    const callArgs = createSpy.mock.calls[0][0]
    expect(callArgs.userId).toBe('user-1')
    expect(callArgs.title).toBe('Test Task')
  })

  it('should throw when repository create fails', async () => {
    vi.spyOn(mockTaskRepository, 'create').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ userId: 'user-1', title: 'Test Task' }),
    ).rejects.toThrow('Database error')
  })

  it('should create task with default priority MEDIUM', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({ userId: 'user-1', title: 'Test Task' })

    expect(result.priority).toBe('MEDIUM')
  })

  it('should create task with completed false by default', async () => {
    const task = Task.create('user-1', 'Test Task')

    vi.spyOn(mockTaskRepository, 'create').mockResolvedValue(task)

    const result = await useCase.execute({ userId: 'user-1', title: 'Test Task' })

    expect(result.completed).toBe(false)
  })
})