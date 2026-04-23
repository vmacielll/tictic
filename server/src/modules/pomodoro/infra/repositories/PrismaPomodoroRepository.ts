import type { PrismaClient, PomodoroStatus as PrismaPomodoroStatus } from '@prisma/client'
import {
  PomodoroSession,
  type PomodoroStatus,
} from '../../domain/entities/PomodoroSession'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { prismaPomodoroToDomain } from '@shared/mappers/prismaPomodoroMapper'

export class PrismaPomodoroRepository implements IPomodoroRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    id: string
    userId: string
    taskId?: string
    duration: number
    startedAt: Date
    status: PrismaPomodoroStatus
    completedAt?: Date
  }): Promise<PomodoroSession> {
    const created = await this.prisma.pomodoroSession.create({
      data: {
        id: data.id,
        userId: data.userId,
        taskId: data.taskId ?? null,
        duration: data.duration,
        startedAt: data.startedAt,
        status: data.status,
        completedAt: data.completedAt ?? null,
      },
    })
    return prismaPomodoroToDomain(created)
  }

  async findById(id: string, userId: string): Promise<PomodoroSession | null> {
    const session = await this.prisma.pomodoroSession.findUnique({
      where: { id },
    })
    if (!session || session.userId !== userId) return null
    return prismaPomodoroToDomain(session)
  }

  async findByUserId(userId: string): Promise<PomodoroSession[]> {
    const sessions = await this.prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    })
    return sessions.map(prismaPomodoroToDomain)
  }

  async findActiveByUserId(userId: string): Promise<PomodoroSession | null> {
    const session = await this.prisma.pomodoroSession.findFirst({
      where: {
        userId,
        status: 'RUNNING',
      },
      orderBy: { startedAt: 'desc' },
    })
    if (!session) return null
    return prismaPomodoroToDomain(session)
  }

  async save(session: PomodoroSession): Promise<PomodoroSession> {
    const updated = await this.prisma.pomodoroSession.update({
      where: { id: session.id },
      data: {
        status: session.status,
        completedAt: session.completedAt ?? null,
      },
    })
    return prismaPomodoroToDomain(updated)
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.pomodoroSession.delete({
      where: { id, userId },
    })
  }
}
