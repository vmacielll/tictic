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
      findByDueDate: vi.fn(),
      findInboxByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
    }
    useCase = new ListTasksByDate(mockTaskRepository)
  })

  it('should list tasks for a specific date', async () => {
    const task = Task.create('user-1', 'Task 1')
    ;(task as any)._dueDate = '2024-12-25'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-12-25',
      timezone: 'UTC',
    })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Task 1')
  })

  it('should return empty list when no tasks for date', async () => {
    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-12-25',
      timezone: 'UTC',
    })

    expect(result).toHaveLength(0)
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByDueDate').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        date: '2024-12-25',
        timezone: 'UTC',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should map tasks to response format', async () => {
    const task = Task.create('user-1', 'Task 1', 'Description', 'HIGH')
    ;(task as any)._dueDate = '2024-12-25'
    ;(task as any)._dueTime = '14:30:00'
    ;(task as any)._dueTimezone = 'America/Sao_Paulo'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-12-25',
      timezone: 'UTC',
    })

    expect(result[0].title).toBe('Task 1')
    expect(result[0].description).toBe('Description')
    expect(result[0].priority).toBe('HIGH')
    expect(result[0].dueDate).toBe('2024-12-25')
    expect(result[0].dueTime).toBe('14:30:00')
    expect(result[0].dueTimezone).toBe('America/Sao_Paulo')
  })
})