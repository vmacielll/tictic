import { PomodoroSession } from '@modules/pomodoro/domain/entities/PomodoroSession'
import type { PomodoroStatus } from '@modules/pomodoro/domain/types/PomodoroStatus'
import type { PomodoroSession as PrismaPomodoroSession } from '@prisma/client'
import type { Mapper } from './Mapper'

export const prismaPomodoroMapper: Mapper<PomodoroSession, PrismaPomodoroSession> = {
  toDomain(data: PrismaPomodoroSession): PomodoroSession {
    return PomodoroSession.reconstitute({
      id: data.id,
      userId: data.userId,
      taskId: data.taskId ?? undefined,
      duration: data.duration,
      startedAt: data.startedAt,
      completedAt: data.completedAt ?? undefined,
      status: data.status as PomodoroStatus,
    })
  },
  toPrisma(domain: PomodoroSession): PrismaPomodoroSession {
    return {
      id: domain.id,
      userId: domain.userId,
      taskId: domain.taskId ?? null,
      duration: domain.duration,
      startedAt: domain.startedAt,
      completedAt: domain.completedAt ?? null,
      status: domain.status,
    } as PrismaPomodoroSession
  },
}

export function prismaPomodoroToDomain(data: PrismaPomodoroSession): PomodoroSession {
  return prismaPomodoroMapper.toDomain(data)
}