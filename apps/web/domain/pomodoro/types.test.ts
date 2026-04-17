import { describe, it, expect } from 'vitest'
import {
  parsePomodoro,
  parsePomodoroList,
  parseActivePomodoro,
  isRunning,
  isCompleted,
  isCancelled,
  getTimeLeft,
  getElapsed,
  startPomodoroSchema,
  type PomodoroSession,
} from './types'

const validPayload = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  userId: 'b2c3d4e5-f6a7-4901-bcde-f12345678901',
  taskId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
  duration: 25,
  startedAt: '2026-04-10T10:00:00Z',
  completedAt: undefined,
  status: 'RUNNING' as const,
}

describe('parsePomodoro', () => {
  it('parses a valid pomodoro session', () => {
    const session = parsePomodoro(validPayload)

    expect(session.id).toBe('a1b2c3d4-e5f6-4890-abcd-ef1234567890')
    expect(session.duration).toBe(25)
    expect(session.startedAt).toBeInstanceOf(Date)
    expect(session.startedAt.toISOString()).toBe('2026-04-10T10:00:00.000Z')
    expect(session.status).toBe('RUNNING')
    expect(session.taskId).toBe('c3d4e5f6-a7b8-4012-8def-123456789012')
  })

  it('handles optional taskId as undefined', () => {
    const payload = { ...validPayload, taskId: undefined }
    const session = parsePomodoro(payload)
    expect(session.taskId).toBeUndefined()
  })

  it('throws on invalid status', () => {
    const payload = { ...validPayload, status: 'PAUSED' }
    expect(() => parsePomodoro(payload)).toThrow()
  })

  it('throws on negative duration', () => {
    const payload = { ...validPayload, duration: -5 }
    expect(() => parsePomodoro(payload)).toThrow()
  })
})

describe('parsePomodoroList', () => {
  it('parses wrapped pomodoro sessions', () => {
    const raw = {
      pomodoroSessions: [
        validPayload,
        { ...validPayload, id: 'd4e5f6a7-b8c9-4123-8efa-234567890123' },
      ],
    }
    const sessions = parsePomodoroList(raw)

    expect(sessions).toHaveLength(2)
    expect(sessions[0].startedAt).toBeInstanceOf(Date)
  })
})

describe('parseActivePomodoro', () => {
  it('parses active pomodoro session', () => {
    const raw = { pomodoroSession: validPayload }
    const session = parseActivePomodoro(raw)

    expect(session).not.toBeNull()
    expect(session!.status).toBe('RUNNING')
  })

  it('returns null when no active session', () => {
    const raw = {}
    const session = parseActivePomodoro(raw)
    expect(session).toBeNull()
  })

  it('returns null when pomodoroSession is undefined', () => {
    const raw = { pomodoroSession: undefined }
    const session = parseActivePomodoro(raw)
    expect(session).toBeNull()
  })
})

describe('isRunning / isCompleted / isCancelled', () => {
  it('identifies running session', () => {
    const session = parsePomodoro(validPayload)
    expect(isRunning(session)).toBe(true)
    expect(isCompleted(session)).toBe(false)
    expect(isCancelled(session)).toBe(false)
  })

  it('identifies completed session', () => {
    const session = parsePomodoro({ ...validPayload, status: 'COMPLETED', completedAt: '2026-04-10T10:25:00Z' })
    expect(isCompleted(session)).toBe(true)
    expect(isRunning(session)).toBe(false)
  })

  it('identifies cancelled session', () => {
    const session = parsePomodoro({ ...validPayload, status: 'CANCELLED' })
    expect(isCancelled(session)).toBe(true)
    expect(isRunning(session)).toBe(false)
  })
})

describe('getTimeLeft', () => {
  it('returns remaining time for running session', () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000) // started 5 min ago
    const session: PomodoroSession = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      duration: 25,
      startedAt,
      completedAt: undefined,
      status: 'RUNNING',
      taskId: undefined,
    }
    const timeLeft = getTimeLeft(session, new Date())

    // Should be roughly 20 minutes (1,200,000ms) — allow ±5s tolerance
    expect(timeLeft).toBeGreaterThan(1_195_000)
    expect(timeLeft).toBeLessThan(1_205_000)
  })

  it('returns 0 for completed session', () => {
    const session: PomodoroSession = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      duration: 25,
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'COMPLETED',
      taskId: undefined,
    }
    expect(getTimeLeft(session)).toBe(0)
  })
})

describe('getElapsed', () => {
  it('returns elapsed time for running session', () => {
    const startedAt = new Date(Date.now() - 10 * 60 * 1000) // started 10 min ago
    const session: PomodoroSession = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      duration: 25,
      startedAt,
      completedAt: undefined,
      status: 'RUNNING',
      taskId: undefined,
    }
    const elapsed = getElapsed(session, new Date())

    expect(elapsed).toBeGreaterThan(595_000)
    expect(elapsed).toBeLessThan(605_000)
  })
})

describe('startPomodoroSchema', () => {
  it('validates valid input', () => {
    const result = startPomodoroSchema.safeParse({ duration: 25 })
    expect(result.success).toBe(true)
  })

  it('allows empty object', () => {
    const result = startPomodoroSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects negative duration', () => {
    const result = startPomodoroSchema.safeParse({ duration: -1 })
    expect(result.success).toBe(false)
  })
})
