import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { ListInboxTasks } from './ListInboxTasks'
import { Task } from '../../domain/entities/Task'

describe('ListInboxTasks', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: ListInboxTasks

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
    useCase = new ListInboxTasks(mockTaskRepository)
  })

  it('should list inbox tasks for a user', async () => {
    const task1 = Task.create('user-1', 'Inbox Task 1')
    const task2 = Task.create('user-1', 'Inbox Task 2')

    vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockResolvedValue([task1, task2])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Inbox Task 1')
    expect(result[1].title).toBe('Inbox Task 2')
  })

  it('should return empty list when no inbox tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockResolvedValue([])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result).toHaveLength(0)
  })

  it('should call repository with correct userId', async () => {
    const task = Task.create('user-1', 'Task')
    const findInboxSpy = vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockResolvedValue([task])

    await useCase.execute({ userId: 'user-1' })

    expect(findInboxSpy).toHaveBeenCalledWith('user-1')
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ userId: 'user-1' }),
    ).rejects.toThrow('Database error')
  })

  it('should map tasks to response format', async () => {
    const task = Task.create('user-1', 'Inbox Task', 'Description', 'HIGH')

    vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockResolvedValue([task])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result[0].title).toBe('Inbox Task')
    expect(result[0].description).toBe('Description')
    expect(result[0].priority).toBe('HIGH')
    expect(result[0].completed).toBe(false)
  })

  it('should return tasks without dueDate (inbox)', async () => {
    const task = Task.create('user-1', 'Inbox Task')

    vi.spyOn(mockTaskRepository, 'findInboxByUserId').mockResolvedValue([task])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result[0].dueDate).toBeUndefined()
  })
})