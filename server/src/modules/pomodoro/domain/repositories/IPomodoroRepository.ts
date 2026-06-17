import { type PomodoroSession, type PomodoroStatus } from '../entities/PomodoroSession'
import type { PomodoroSessionWithTask } from '../../infra/repositories/PrismaPomodoroRepository'

export interface IPomodoroRepository {
  create(data: {
    id: string
    userId: string
    taskId?: string
    duration: number
    startedAt: Date
    status: PomodoroStatus
    completedAt?: Date
  }): Promise<PomodoroSession>

  findById(id: string, userId: string): Promise<PomodoroSession | null>

  findByUserId(userId: string): Promise<PomodoroSessionWithTask[]>

  findActiveByUserId(userId: string): Promise<PomodoroSession | null>

  save(session: PomodoroSession): Promise<PomodoroSession>

  delete(id: string, userId: string): Promise<void>
}
