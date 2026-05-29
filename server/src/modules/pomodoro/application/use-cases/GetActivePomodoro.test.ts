import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GetActivePomodoro } from './GetActivePomodoro'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { PomodoroSession } from '../../domain/entities/PomodoroSession'

describe('GetActivePomodoro', () => {
  let useCase: GetActivePomodoro
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
    useCase = new GetActivePomodoro(pomodoroRepository)
  })

  it('should return active session if one exists', async () => {
    const session = PomodoroSession.create('user-1', 25)
    Object.defineProperty(session, 'id', { value: 'session-1' })

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(session)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSession).toBeDefined()
    expect(result.pomodoroSession?.id).toBe('session-1')
    expect(result.pomodoroSession?.status).toBe('RUNNING')
  })

  it('should return empty object when no active session exists', async () => {
    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(null)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.pomodoroSession).toBeUndefined()
  })

  it('should include completedAt as null for active session', async () => {
    const session = PomodoroSession.create('user-1', 25)
    Object.defineProperty(session, 'id', { value: 'session-1' })

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(session)

    const result = await useCase.execute({ userId: 'user-1' })

    // Active sessions have completedAt as null
    expect(result.pomodoroSession?.completedAt).toBeNull()
    expect(result.pomodoroSession?.status).toBe('RUNNING')
  })
})
