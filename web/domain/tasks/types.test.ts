import { describe, it, expect } from 'vitest'
import {
  parseTask,
  parseTasks,
  isInbox,
  isDueToday,
  isOverdue,
  isCompleted,
  createTaskSchema,
  updateTaskSchema,
  type TaskResponse,
} from './types'

const validTaskPayload: TaskResponse = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  title: 'Test task',
  description: 'A test task description',
  priority: 'MEDIUM',
  dueDate: '2026-04-10',
  dueTime: '14:00',
  dueTimezone: 'America/Sao_Paulo',
  completed: false,
  completedAt: undefined,
  listId: 'b2c3d4e5-f6a7-4901-8cde-f12345678901',
  userId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-10T08:00:00.000Z',
}

describe('parseTask', () => {
  it('parses a valid task response and converts strings to Date', () => {
    const task = parseTask(validTaskPayload)

    expect(task.id).toBe('a1b2c3d4-e5f6-4890-abcd-ef1234567890')
    expect(task.title).toBe('Test task')
    expect(task.priority).toBe('MEDIUM')
    expect(task.dueDate).toBeInstanceOf(Date)
    expect(task.dueDate?.toISOString().split('T')[0]).toBe('2026-04-10')
    expect(task.dueTime).toBe('14:00')
    expect(task.createdAt).toBeInstanceOf(Date)
    expect(task.updatedAt).toBeInstanceOf(Date)
    expect(task.completed).toBe(false)
  })

  it('handles optional fields as undefined', () => {
    const payload = {
      ...validTaskPayload,
      description: undefined,
      dueDate: undefined,
      dueTime: undefined,
      dueTimezone: undefined,
      completedAt: undefined,
      listId: undefined,
    }
    const task = parseTask(payload)

    expect(task.description).toBeUndefined()
    expect(task.dueDate).toBeUndefined()
    expect(task.dueTime).toBeUndefined()
    expect(task.dueTimezone).toBeUndefined()
    expect(task.completedAt).toBeUndefined()
    expect(task.listId).toBeUndefined()
  })

  it('parses dueTimezone correctly', () => {
    const task = parseTask(validTaskPayload)

    expect(task.dueTimezone).toBe('America/Sao_Paulo')
  })

  it('throws on missing required field', () => {
    const payload = { ...validTaskPayload }
    // @ts-expect-error — intentionally removing required field
    delete payload.title

    expect(() => parseTask(payload)).toThrow()
  })

  it('throws on invalid priority', () => {
    const payload = { ...validTaskPayload, priority: 'URGENT' }

    expect(() => parseTask(payload)).toThrow()
  })

  it('throws on invalid UUID', () => {
    const payload = { ...validTaskPayload, id: 'not-a-uuid' }

    expect(() => parseTask(payload)).toThrow()
  })
})

describe('parseTasks', () => {
  it('parses an array of tasks', () => {
    const tasks = parseTasks([validTaskPayload, { ...validTaskPayload, id: 'd4e5f6a7-b8c9-4123-8efa-234567890123' }])

    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toBeInstanceOf(Object)
    expect(tasks[0].dueDate).toBeInstanceOf(Date)
  })
})

describe('isInbox', () => {
  it('returns true when dueDate is undefined', () => {
    const task = parseTask({ ...validTaskPayload, dueDate: undefined })
    expect(isInbox(task)).toBe(true)
  })

  it('returns false when dueDate is defined', () => {
    const task = parseTask(validTaskPayload)
    expect(isInbox(task)).toBe(false)
  })
})

describe('isDueToday', () => {
  it('returns true when task is due today', () => {
    const task = parseTask({
      ...validTaskPayload,
      dueDate: '2026-04-10',
    })
    // The validTaskPayload has dueDate: '2026-04-10', create a matching reference
    const ref = new Date('2026-04-10T00:00:00.000Z')
    expect(isDueToday(task, ref)).toBe(true)
  })

  it('returns false when task is due yesterday', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const task = parseTask({
      ...validTaskPayload,
      dueDate: yesterdayStr,
    })
    expect(isDueToday(task, today)).toBe(false)
  })

  it('returns false when task has no dueDate', () => {
    const task = parseTask({ ...validTaskPayload, dueDate: undefined })
    expect(isDueToday(task)).toBe(false)
  })
})

describe('isOverdue', () => {
  it('returns true for overdue task', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const task = parseTask({
      ...validTaskPayload,
      dueDate: yesterdayStr,
      completed: false,
    })
    expect(isOverdue(task, today)).toBe(true)
  })

  it('returns false for completed overdue task', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const task = parseTask({
      ...validTaskPayload,
      dueDate: yesterdayStr,
      completed: true,
    })
    expect(isOverdue(task, today)).toBe(false)
  })

  it('returns false for future task', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const task = parseTask({
      ...validTaskPayload,
      dueDate: tomorrowStr,
      completed: false,
    })
    expect(isOverdue(task, today)).toBe(false)
  })
})

describe('isCompleted', () => {
  it('returns true for completed task', () => {
    const task = parseTask({ ...validTaskPayload, completed: true })
    expect(isCompleted(task)).toBe(true)
  })

  it('returns false for incomplete task', () => {
    const task = parseTask({ ...validTaskPayload, completed: false })
    expect(isCompleted(task)).toBe(false)
  })
})

describe('createTaskSchema', () => {
  it('validates valid input', () => {
    const result = createTaskSchema.safeParse({ title: 'New task' })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })
})

describe('updateTaskSchema', () => {
  it('allows partial updates', () => {
    const result = updateTaskSchema.safeParse({ title: 'Updated' })
    expect(result.success).toBe(true)
  })

  it('allows empty object', () => {
    const result = updateTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
