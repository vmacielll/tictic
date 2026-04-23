import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StartPomodoro } from './StartPomodoro'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { PomodoroSession } from '../../domain/entities/PomodoroSession'
import { AppError } from '@shared/errors/AppError'

describe('StartPomodoro', () => {
  let useCase: StartPomodoro
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
    useCase = new StartPomodoro(pomodoroRepository)
  })

  it('should start a new Pomodoro session', async () => {
    const userId = 'user-1'
    const duration = 25

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(null)
    vi.spyOn(pomodoroRepository, 'create').mockImplementation(async (props) => {
      return PomodoroSession.reconstitute({
        ...props,
        id: 'session-1',
      })
    })

    const result = await useCase.execute({ userId, duration })

    expect(result).toMatchObject({
      id: 'session-1',
      userId: 'user-1',
      duration: 25,
      status: 'RUNNING',
    })
    expect(pomodoroRepository.create).toHaveBeenCalled()
  })

  it('should start a session with a taskId', async () => {
    const userId = 'user-1'
    const duration = 30
    const taskId = 'task-123'

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(null)
    vi.spyOn(pomodoroRepository, 'create').mockImplementation(async (props) => {
      return PomodoroSession.reconstitute({
        ...props,
        id: 'session-1',
      })
    })

    const result = await useCase.execute({ userId, duration, taskId })

    expect(result.taskId).toBe('task-123')
  })

  it('should throw if there is already an active session', async () => {
    const userId = 'user-1'
    const duration = 25

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(
      PomodoroSession.create('user-1', 25)
    )

    await expect(useCase.execute({ userId, duration })).rejects.toThrow(
      AppError
    )
    await expect(useCase.execute({ userId, duration })).rejects.toMatchObject({
      message: 'You already have an active Pomodoro session running',
      code: 'ACTIVE_SESSION_EXISTS',
      statusCode: 409,
    })
  })

  it('should not create a session if active session exists', async () => {
    const userId = 'user-1'
    const duration = 25

    vi.spyOn(pomodoroRepository, 'findActiveByUserId').mockResolvedValue(
      PomodoroSession.create('user-1', 25)
    )

    try {
      await useCase.execute({ userId, duration })
    } catch {
      // ignore
    }

    expect(pomodoroRepository.create).not.toHaveBeenCalled()
  })
})
