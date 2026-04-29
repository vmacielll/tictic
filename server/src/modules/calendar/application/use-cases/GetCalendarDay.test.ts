import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import { GetCalendarDay } from './GetCalendarDay'
import { Task } from '../../../tasks/domain/entities/Task'

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
      findByDueDate: vi.fn(),
      findInboxByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countByUserId: vi.fn(),
    }
    useCase = new GetCalendarDay(mockTaskRepository)
  })

  it('should return tasks for a specific day', async () => {
    const task = Task.create('user-1', 'Task')
    ;(task as any)._dueDate = '2024-03-15'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Task')
  })

  it('should return empty tasks array when no tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks).toHaveLength(0)
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByDueDate').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        date: '2024-03-15',
        timezone: 'America/Sao_Paulo',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should return date in YYYY-MM-DD format', async () => {
    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.date).toBe('2024-03-15')
  })

  it('should include task description when present', async () => {
    const task = Task.create('user-1', 'Task', 'Description')
    ;(task as any)._dueDate = '2024-03-15'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].description).toBe('Description')
  })

  it('should include listId when task has list', async () => {
    const task = Task.create('user-1', 'Task')
    ;(task as any)._dueDate = '2024-03-15'
    ;(task as any)._listId = 'list-1'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].listId).toBe('list-1')
  })

  it('should include priority', async () => {
    const task = Task.create('user-1', 'Task', undefined, 'HIGH')
    ;(task as any)._dueDate = '2024-03-15'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].priority).toBe('HIGH')
  })

  it('should include completed status', async () => {
    const task = Task.create('user-1', 'Task')
    ;(task as any)._dueDate = '2024-03-15'
    task.complete()

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].completed).toBe(true)
  })

  it('should return dueDate as YYYY-MM-DD string', async () => {
    const task = Task.create('user-1', 'Task')
    ;(task as any)._dueDate = '2024-03-15'

    vi.spyOn(mockTaskRepository, 'findByDueDate').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: '2024-03-15',
      timezone: 'America/Sao_Paulo',
    })

    expect(result.tasks[0].dueDate).toBe('2024-03-15')
  })
})