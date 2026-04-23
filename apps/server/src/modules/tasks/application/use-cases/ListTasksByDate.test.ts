import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { ListTasksByDate } from './ListTasksByDate'
import { Task } from '../../domain/entities/Task'

describe('ListTasksByDate', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: ListTasksByDate

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
    useCase = new ListTasksByDate(mockTaskRepository)
  })

  it('should list tasks for a specific date', async () => {
    const task = Task.create('user-1', 'Task 1')
    ;(task as any)._dueDate = new Date('2024-12-25T10:00:00Z')

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-12-25'),
      timezone: 'UTC',
    })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Task 1')
  })

  it('should return empty list when no tasks for date', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-12-25'),
      timezone: 'UTC',
    })

    expect(result).toHaveLength(0)
  })

  it('should convert date to user timezone', async () => {
    const task = Task.create('user-1', 'Task 1')
    const findByDateRangeSpy = vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-12-25T12:00:00Z'),
      timezone: 'America/New_York',
    })

    expect(findByDateRangeSpy).toHaveBeenCalled()
    const [userId, startDate, endDate] = findByDateRangeSpy.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(startDate).toBeInstanceOf(Date)
    expect(endDate).toBeInstanceOf(Date)
  })

  it('should call repository with date range', async () => {
    const task = Task.create('user-1', 'Task 1')
    const findByDateRangeSpy = vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const inputDate = new Date('2024-12-25')
    await useCase.execute({
      userId: 'user-1',
      date: inputDate,
      timezone: 'UTC',
    })

    expect(findByDateRangeSpy).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date)
    )
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        date: new Date('2024-12-25'),
        timezone: 'UTC',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should map tasks to response format', async () => {
    const task = Task.create('user-1', 'Task 1', 'Description', 'HIGH')
    ;(task as any)._dueDate = new Date('2024-12-25T10:00:00Z')

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-12-25'),
      timezone: 'UTC',
    })

    expect(result[0].title).toBe('Task 1')
    expect(result[0].description).toBe('Description')
    expect(result[0].priority).toBe('HIGH')
  })
})