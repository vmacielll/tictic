import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListPomodoros } from './ListPomodoros'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { PomodoroSession } from '../../domain/entities/PomodoroSession'

describe('ListPomodoros', () => {
  let useCase: ListPomodoros
  let pomodoroRepository: IPomodoroRepository

  beforeEach(() => {
    pomodoroRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findActiveByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new ListPomodoros(pomodoroRepository)
  })

  it('should return all pomodoro sessions for a user', async () => {
    const session1 = PomodoroSession.create('user-1', 25)
    const session2 = PomodoroSession.create('user-1', 30)
    Object.defineProperty(session1, 'id', { value: 'session-1' })
    Object.defineProperty(session2, 'id', { value: 'session-2' })

    vi.spyOn(pomodoroRepository, 'findByUserId').mockResolvedValue([
      { session: session1 },
      { session: session2 },
    ])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSessions).toHaveLength(2)
    expect(result.pomodoroSessions[0].id).toBe('session-1')
    expect(result.pomodoroSessions[1].id).toBe('session-2')
  })

  it('should return empty array when user has no sessions', async () => {
    vi.spyOn(pomodoroRepository, 'findByUserId').mockResolvedValue([])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSessions).toHaveLength(0)
  })

  it('should include completedAt in DTO for completed sessions', async () => {
    const startedAt = new Date('2026-04-08T10:00:00Z')
    const completedAt = new Date('2026-04-08T10:25:00Z')
    const session = PomodoroSession.reconstitute({
      id: 'session-1',
      userId: 'user-1',
      duration: 25,
      startedAt,
      completedAt,
      status: 'COMPLETED',
    })

    vi.spyOn(pomodoroRepository, 'findByUserId').mockResolvedValue([{ session }])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSessions[0].completedAt).toBeDefined()
    expect(result.pomodoroSessions[0].status).toBe('COMPLETED')
  })

  it('should have null completedAt for running sessions', async () => {
    const session = PomodoroSession.create('user-1', 25)
    Object.defineProperty(session, 'id', { value: 'session-1' })

    vi.spyOn(pomodoroRepository, 'findByUserId').mockResolvedValue([{ session }])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSessions[0].completedAt).toBeNull()
    expect(result.pomodoroSessions[0].status).toBe('RUNNING')
  })
})
