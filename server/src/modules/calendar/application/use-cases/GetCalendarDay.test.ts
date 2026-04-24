import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import { GetCalendarDay } from './GetCalendarDay'
import { Task } from '../../../tasks/domain/entities/Task'
import { testDate } from '../../../../__tests__/utils/dateUtils'

describe('GetCalendarDay', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: GetCalendarDay

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
    useCase = new GetCalendarDay(mockTaskRepository)
  })

  it('should return tasks for a specific day', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Task')
  })

  it('should return empty tasks array when no tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks).toHaveLength(0)
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        date: testDate(2024, 3, 15),
        timezone: 'America/Sao_Paulo',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should return date in YYYY-MM-DD format', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.date).toBe('2024-03-15')
  })

  it('should include task description when present', async () => {
    const task = Task.create('user-1', 'Task', 'Description')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].description).toBe('Description')
  })

  it('should include listId when task has list', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].listId).toBeUndefined()
  })

  it('should include priority', async () => {
    const task = Task.create('user-1', 'Task', undefined, 'HIGH')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].priority).toBe('HIGH')
  })

  it('should include completed status', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].completed).toBe(false)
  })

  it('should convert dueDate to ISO string', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})