import {
  PomodoroSession,
  type PomodoroSessionProps,
  type PomodoroStatus,
} from '@modules/pomodoro/domain/entities/PomodoroSession'

interface PrismaPomodoroSession {
  id: string
  userId: string
  taskId: string | null
  duration: number
  startedAt: Date
  completedAt: Date | null
  status: string
}

export function prismaPomodoroToDomain(data: PrismaPomodoroSession): PomodoroSession {
  const props: PomodoroSessionProps = {
    id: data.id,
    userId: data.userId,
    taskId: data.taskId ?? undefined,
    duration: data.duration,
    startedAt: data.startedAt,
    completedAt: data.completedAt ?? undefined,
    status: data.status as PomodoroStatus,
  }
  return PomodoroSession.reconstitute(props)
}