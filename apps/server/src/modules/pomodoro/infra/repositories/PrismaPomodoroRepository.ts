import { PrismaClient, PomodoroSession as PrismaPomodoroSession, PomodoroStatus as PrismaPomodoroStatus } from '@prisma/client'
import {
  PomodoroSession,
  type PomodoroSessionProps,
  type PomodoroStatus,
} from '../../domain/entities/PomodoroSession'
import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'

const prisma = new PrismaClient()

export class PrismaPomodoroRepository implements IPomodoroRepository {
  private toEntity(data: PrismaPomodoroSession): PomodoroSession {
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

  async create(data: {
    id: string
    userId: string
    taskId?: string
    duration: number
    startedAt: Date
    status: PrismaPomodoroStatus
    completedAt?: Date
  }): Promise<PomodoroSession> {
    const created = await prisma.pomodoroSession.create({
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
    return this.toEntity(created)
  }

  async findById(id: string): Promise<PomodoroSession | null> {
    const session = await prisma.pomodoroSession.findUnique({
      where: { id },
    })
    if (!session) return null
    return this.toEntity(session)
  }

  async findByUserId(userId: string): Promise<PomodoroSession[]> {
    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    })
    return sessions.map(this.toEntity.bind(this))
  }

  async findActiveByUserId(userId: string): Promise<PomodoroSession | null> {
    const session = await prisma.pomodoroSession.findFirst({
      where: {
        userId,
        status: 'RUNNING',
      },
      orderBy: { startedAt: 'desc' },
    })
    if (!session) return null
    return this.toEntity(session)
  }

  async save(session: PomodoroSession): Promise<PomodoroSession> {
    const updated = await prisma.pomodoroSession.update({
      where: { id: session.id },
      data: {
        status: session.status,
        completedAt: session.completedAt ?? null,
      },
    })
    return this.toEntity(updated)
  }

  async delete(id: string): Promise<void> {
    await prisma.pomodoroSession.delete({
      where: { id },
    })
  }
}
