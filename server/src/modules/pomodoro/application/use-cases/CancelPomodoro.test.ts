import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CancelPomodoro } from './CancelPomodoro'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { PomodoroSession } from '../../domain/entities/PomodoroSession'
import { AppError } from '@shared/errors/AppError'

describe('CancelPomodoro', () => {
  let useCase: CancelPomodoro
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
    useCase = new CancelPomodoro(pomodoroRepository)
  })

  it('should cancel a running session', async () => {
    const session = PomodoroSession.create('user-1', 25)
    Object.defineProperty(session, 'id', { value: 'session-1' })

    vi.spyOn(pomodoroRepository, 'findById').mockResolvedValue(session)
    vi.spyOn(pomodoroRepository, 'save').mockImplementation(async (s) => s)

    const result = await useCase.execute({ sessionId: 'session-1', userId: 'user-1' })

    expect(result.status).toBe('CANCELLED')
  })

  it('should throw if session not found', async () => {
    vi.spyOn(pomodoroRepository, 'findById').mockResolvedValue(null)

    await expect(
      useCase.execute({ sessionId: 'non-existent', userId: 'user-1' })
    ).rejects.toThrow(
      AppError
    )
    await expect(
      useCase.execute({ sessionId: 'non-existent', userId: 'user-1' })
    ).rejects.toMatchObject({
      message: 'Pomodoro session not found',
      code: 'POMODORO_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('should throw if user is not the owner', async () => {
    const session = PomodoroSession.create('user-1', 25)
    Object.defineProperty(session, 'id', { value: 'session-1' })

    vi.spyOn(pomodoroRepository, 'findById').mockResolvedValue(session)

    await expect(
      useCase.execute({ sessionId: 'session-1', userId: 'user-2' })
    ).rejects.toThrow(
      AppError
    )
    await expect(
      useCase.execute({ sessionId: 'session-1', userId: 'user-2' })
    ).rejects.toMatchObject({
      message: 'You do not have permission to access this session',
      code: 'FORBIDDEN',
      statusCode: 403,
    })
  })

  it('should throw if session is already completed', async () => {
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

    vi.spyOn(pomodoroRepository, 'findById').mockResolvedValue(session)

    await expect(
      useCase.execute({ sessionId: 'session-1', userId: 'user-1' })
    ).rejects.toThrow('Cannot cancel a session that is not running')
  })

  it('should throw if session is already cancelled', async () => {
    const startedAt = new Date('2026-04-08T10:00:00Z')
    const session = PomodoroSession.reconstitute({
      id: 'session-1',
      userId: 'user-1',
      duration: 25,
      startedAt,
      status: 'CANCELLED',
    })

    vi.spyOn(pomodoroRepository, 'findById').mockResolvedValue(session)

    await expect(
      useCase.execute({ sessionId: 'session-1', userId: 'user-1' })
    ).rejects.toThrow('Cannot cancel a session that is not running')
  })
})
