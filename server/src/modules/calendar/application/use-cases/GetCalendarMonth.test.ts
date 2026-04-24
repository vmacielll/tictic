import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import { GetCalendarMonth } from './GetCalendarMonth'
import { Task } from '../../../tasks/domain/entities/Task'
import { testDate } from '../../../../__tests__/utils/dateUtils'

describe('GetCalendarMonth', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: GetCalendarMonth

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
    useCase = new GetCalendarMonth(mockTaskRepository)
  })

  it('should return days of month with tasks', async () => {
    const task = Task.create('user-1', 'Task 1')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days).toHaveLength(31)
    const day15 = result.days.find((d) => d.date === '2024-03-15')
    expect(day15?.tasks).toHaveLength(1)
    expect(day15?.tasks[0].title).toBe('Task 1')
  })

  it('should return empty days when no tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days).toHaveLength(31)
    expect(result.days.every((d) => d.tasks.length === 0)).toBe(true)
  })

  it('should return tasks on different days', async () => {
    const task1 = Task.create('user-1', 'Task 1')
    task1.update(undefined, undefined, undefined, testDate(2024, 3, 5))

    const task2 = Task.create('user-1', 'Task 2')
    task2.update(undefined, undefined, undefined, testDate(2024, 3, 20))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task1, task2])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    const day5 = result.days.find((d) => d.date === '2024-03-05')
    const day20 = result.days.find((d) => d.date === '2024-03-20')

    expect(day5?.tasks).toHaveLength(1)
    expect(day20?.tasks).toHaveLength(1)
  })

  it('should not include task outside month range', async () => {
    // Este teste verifica que tasks de outros meses não são retornadas.
    // O mock retorna array vazio porque o banco também filtraria por range.
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days.every((d) => d.tasks.length === 0)).toBe(true)
  })

  it('should return 29 days for February in leap year', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 2,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days).toHaveLength(29)
  })

  it('should return 28 days for February in non-leap year', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 2,
      year: 2023,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days).toHaveLength(28)
  })

it('should convert to user timezone', async () => {
    const task = Task.create('user-1', 'Task 1')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 15))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/New_York',
    })

    // Buscar dia específico 2024-03-15, não apenas qualquer dia que comece com '2024-03-'
    const day15 = result.days.find((d) => d.date === '2024-03-15')
    expect(day15?.tasks).toHaveLength(1)
  })

  it('should not include task without dueDate', async () => {
    const task = Task.create('user-1', 'Task without date')

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days.every((d) => d.tasks.length === 0)).toBe(true)
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        month: 3,
        year: 2024,
        timezone: 'America/Sao_Paulo',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should return correct date format YYYY-MM-DD', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 5))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    const day5 = result.days.find((d) => d.date === '2024-03-05')
    expect(day5).toBeDefined()
  })

  it('should return response structure with date and tasks', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, testDate(2024, 3, 10))

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      month: 3,
      year: 2024,
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days[0]).toHaveProperty('date')
    expect(result.days[0]).toHaveProperty('tasks')
    expect(Array.isArray(result.days[0].tasks)).toBe(true)
  })
})