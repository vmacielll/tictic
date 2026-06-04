import { describe, it, expect } from 'vitest'
import { PomodoroSession } from '../entities/PomodoroSession'

describe('PomodoroSession', () => {
  describe('create', () => {
    it('should create a new running session', () => {
      const session = PomodoroSession.create('user-1', 25)

      expect(session.id).toBeDefined()
      expect(session.userId).toBe('user-1')
      expect(session.duration).toBe(25)
      expect(session.status).toBe('RUNNING')
      expect(session.isRunning).toBe(true)
      expect(session.isCompleted).toBe(false)
      expect(session.startedAt).toBeInstanceOf(Date)
      expect(session.completedAt).toBeUndefined()
      expect(session.taskId).toBeUndefined()
    })

    it('should create a session with a taskId', () => {
      const session = PomodoroSession.create('user-1', 25, 'task-123')

      expect(session.taskId).toBe('task-123')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute a session from props', () => {
      const startedAt = new Date('2026-04-08T10:00:00Z')
      const completedAt = new Date('2026-04-08T10:25:00Z')

      const session = PomodoroSession.reconstitute({
        id: 'session-1',
        userId: 'user-1',
        taskId: 'task-123',
        duration: 25,
        startedAt,
        completedAt,
        status: 'COMPLETED',
      })

      expect(session.id).toBe('session-1')
      expect(session.userId).toBe('user-1')
      expect(session.taskId).toBe('task-123')
      expect(session.duration).toBe(25)
      expect(session.status).toBe('COMPLETED')
      expect(session.completedAt).toEqual(completedAt)
    })
  })

  describe('complete', () => {
    it('should complete a running session', () => {
      const session = PomodoroSession.create('user-1', 25)

      session.complete()

      expect(session.status).toBe('COMPLETED')
      expect(session.isCompleted).toBe(true)
      expect(session.completedAt).toBeDefined()
    })

    it('should throw when completing a non-running session', () => {
      const session = PomodoroSession.create('user-1', 25)
      session.complete()

      expect(() => session.complete()).toThrow('Cannot complete a session that is not running')
    })
  })

  describe('cancel', () => {
    it('should cancel a running session', () => {
      const session = PomodoroSession.create('user-1', 25)

      session.cancel()

      expect(session.status).toBe('CANCELLED')
      expect(session.isRunning).toBe(false)
    })

    it('should throw when canceling a non-running session', () => {
      const session = PomodoroSession.create('user-1', 25)
      session.cancel()

      expect(() => session.cancel()).toThrow('Cannot cancel a session that is not running')
    })
  })

  describe('toJSON', () => {
    it('should serialize the session to JSON', () => {
      const session = PomodoroSession.create('user-1', 25, 'task-123')

      const json = session.toJSON()

      expect(json.id).toBe(session.id)
      expect(json.userId).toBe('user-1')
      expect(json.taskId).toBe('task-123')
      expect(json.duration).toBe(25)
      expect(json.status).toBe('RUNNING')
      expect(json.startedAt).toBe(session.startedAt.toISOString())
    })
  })
})
