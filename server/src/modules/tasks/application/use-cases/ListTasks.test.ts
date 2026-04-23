import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { ListTasks } from './ListTasks'
import { Task } from '../../domain/entities/Task'

describe('ListTasks', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: ListTasks

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
    useCase = new ListTasks(mockTaskRepository)
  })

  it('should list tasks for a user', async () => {
    const task1 = Task.create('user-1', 'Task 1')
    const task2 = Task.create('user-1', 'Task 2')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task1, task2])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(2)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.items).toHaveLength(2)
    expect(result.meta.totalCount).toBe(2)
  })

  it('should return empty list when user has no tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(0)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.items).toHaveLength(0)
    expect(result.meta.totalCount).toBe(0)
  })

  it('should apply pagination', async () => {
    const task = Task.create('user-1', 'Task 1')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(10)

    const result = await useCase.execute({
      userId: 'user-1',
      pagination: { skip: 0, take: 5 },
    })

    expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith('user-1', { skip: 0, take: 5 })
    expect(result.meta.size).toBe(5)
  })

  it('should calculate correct page number', async () => {
    const task = Task.create('user-1', 'Task 1')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(25)

    const result = await useCase.execute({
      userId: 'user-1',
      pagination: { skip: 10, take: 5 },
    })

    expect(result.meta.page).toBe(3)
  })

  it('should use default size when not provided', async () => {
    const task = Task.create('user-1', 'Task 1')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(1)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.meta.size).toBe(20)
    expect(result.meta.page).toBe(1)
  })

  it('should call repository with correct userId', async () => {
    const task = Task.create('user-1', 'Task 1')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(1)

    await useCase.execute({ userId: 'user-1' })

    expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined)
    expect(mockTaskRepository.countByUserId).toHaveBeenCalledWith('user-1')
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserId').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({ userId: 'user-1' }),
    ).rejects.toThrow('Database error')
  })

  it('should map tasks to response format', async () => {
    const task = Task.create('user-1', 'Task 1', 'Description', 'HIGH')

    vi.spyOn(mockTaskRepository, 'findByUserId').mockResolvedValue([task])
    vi.spyOn(mockTaskRepository, 'countByUserId').mockResolvedValue(1)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.items[0].title).toBe('Task 1')
    expect(result.items[0].description).toBe('Description')
    expect(result.items[0].priority).toBe('HIGH')
  })
})