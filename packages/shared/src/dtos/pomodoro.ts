import type { PomodoroStatus } from '../types/task'

export interface StartPomodoroDTO {
  duration?: number
  taskId?: string
}

export interface PomodoroSessionResponse {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt?: string
  status: PomodoroStatus
}

export interface ListPomodorosResponse {
  pomodoroSessions: PomodoroSessionResponse[]
}

export interface GetActivePomodoroResponse {
  pomodoroSession?: PomodoroSessionResponse
}
