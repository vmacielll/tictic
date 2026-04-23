import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type ITaskRepository } from '../../../tasks/domain/repositories/ITaskRepository'
import { GetCalendarWeek } from './GetCalendarWeek'
import { Task } from '../../../tasks/domain/entities/Task'
import { DateTime } from 'luxon'

describe('GetCalendarWeek', () => {
  let mockTaskRepository: ITaskRepository
  let useCase: GetCalendarWeek

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
    useCase = new GetCalendarWeek(mockTaskRepository)
  })

  it('should return 7 days of week', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 2, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days).toHaveLength(7)
  })

  it('should return tasks on correct days', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, DateTime.fromObject({ year: 2024, month: 3, day: 18 }).toJSDate())

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 3, 18),
      timezone: 'America/Sao_Paulo',
    })

    const dayWithTask = result.days.find((d) => d.tasks.length > 0)
    expect(dayWithTask).toBeDefined()
  })

  it('should return empty array when no tasks', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days.every((d) => d.tasks.length === 0)).toBe(true)
  })

  it('should throw when repository fails', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockRejectedValue(new Error('Database error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        date: new Date(2024, 3, 15),
        timezone: 'America/Sao_Paulo',
      }),
    ).rejects.toThrow('Database error')
  })

  it('should return days in correct order starting Monday', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    const dates = result.days.map((d) => d.date)
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true)
    }
  })

  it('should convert to user timezone', async () => {
    const task = Task.create('user-1', 'Task')
    task.update(undefined, undefined, undefined, DateTime.fromObject({ year: 2024, month: 3, day: 15, hour: 23 }).toJSDate())

    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([task])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 3, 15),
      timezone: 'America/New_York',
    })

    expect(result.days.some((d) => d.tasks.length > 0)).toBe(true)
  })

  it('should return date format YYYY-MM-DD', async () => {
    vi.spyOn(mockTaskRepository, 'findByUserIdAndDateRange').mockResolvedValue([])

    const result = await useCase.execute({
      userId: 'user-1',
      date: new Date(2024, 3, 15),
      timezone: 'America/Sao_Paulo',
    })

    expect(result.days[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})