import { z } from 'zod'
import { uuidSchema, datetimeString } from '../shared/schemas'

const pomodoroStatusSchema = z.enum(['RUNNING', 'COMPLETED', 'CANCELLED'])

export const pomodoroSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  taskId: uuidSchema.optional(),
  duration: z.number().int().positive(),
  startedAt: datetimeString.transform((d) => new Date(d)),
  completedAt: datetimeString.optional().transform((d) => (d ? new Date(d) : undefined)),
  status: pomodoroStatusSchema,
})

export type PomodoroSession = z.output<typeof pomodoroSchema>

// ── Parsers — lidam com wrappers diferentes do backend ──
export function parsePomodoro(raw: unknown): PomodoroSession {
  return pomodoroSchema.parse(raw)
}

// GET /pomodoro retorna { pomodoroSessions: [...] }
export function parsePomodoroList(raw: unknown): PomodoroSession[] {
  const wrapper = z.object({ pomodoroSessions: z.array(z.unknown()) }).parse(raw)
  return wrapper.pomodoroSessions.map(parsePomodoro)
}

// GET /pomodoro/active retorna { pomodoroSession?: {...} } ou {}
export function parseActivePomodoro(raw: unknown): PomodoroSession | null {
  const wrapper = z.object({ pomodoroSession: z.unknown().optional() }).parse(raw)
  if (!wrapper.pomodoroSession) return null
  return parsePomodoro(wrapper.pomodoroSession)
}

// ── Input schema ──
export const startPomodoroSchema = z.object({
  duration: z.number().int().positive().optional(),
  taskId: uuidSchema.optional(),
})

export type StartPomodoroInput = z.output<typeof startPomodoroSchema>

// ── "Métodos" como funções puras ──

export function isRunning(session: PomodoroSession): boolean {
  return session.status === 'RUNNING'
}

export function isCompleted(session: PomodoroSession): boolean {
  return session.status === 'COMPLETED'
}

export function isCancelled(session: PomodoroSession): boolean {
  return session.status === 'CANCELLED'
}

export function getTimeLeft(session: PomodoroSession, now: Date = new Date()): number {
  if (session.status !== 'RUNNING') return 0
  const totalMs = session.duration * 60 * 1000
  const elapsed = now.getTime() - session.startedAt.getTime()
  return Math.max(0, totalMs - elapsed)
}

export function getElapsed(session: PomodoroSession, now: Date = new Date()): number {
  return now.getTime() - session.startedAt.getTime()
}
