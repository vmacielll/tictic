import { prisma } from '../../../../infra/database/prisma/PrismaClient'
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'
import { TaskTitle } from '../../domain/value-objects/TaskTitle'
import type { Priority } from '../../domain/types/Priority'

export class PrismaTaskRepository implements ITaskRepository {
  async create(data: {
    id: string
    title: string
    description?: string
    priority: Priority
    dueDate?: Date
    dueTime?: Date
    completed: boolean
    completedAt?: Date
    listId?: string
    userId: string
  }): Promise<Task> {
    const prismaTask = await prisma.task.create({
      data: {
        id: data.id,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        dueTime: data.dueTime ?? null,
        completed: Boolean(data.completed),
        completedAt: data.completedAt ?? null,
        listId: data.listId ?? null,
        userId: data.userId,
      },
    })

    return this.toEntity(prismaTask)
  }

  async findById(id: string): Promise<Task | null> {
    const prismaTask = await prisma.task.findUnique({ where: { id } })
    if (!prismaTask) return null
    return this.toEntity(prismaTask)
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const prismaTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return prismaTasks.map(this.toEntity)
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<Task[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const prismaTasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return prismaTasks.map(this.toEntity)
  }

  async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const prismaTasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { dueDate: 'asc' },
    })
    return prismaTasks.map(this.toEntity)
  }

  async findInboxByUserId(userId: string): Promise<Task[]> {
    const prismaTasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: null,
      },
      orderBy: { createdAt: 'desc' },
    })
    return prismaTasks.map(this.toEntity)
  }

  async save(task: Task): Promise<Task> {
    const prismaTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title.value,
        description: task.description ?? null,
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        dueTime: task.dueTime ?? null,
        completed: Boolean(task.completed),
        completedAt: task.completedAt ?? null,
        listId: task.listId ?? null,
        // updatedAt is auto-managed by Prisma (@updatedAt)
      },
    })

    return this.toEntity(prismaTask)
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } })
  }

  private toEntity(prismaTask: {
    id: string
    title: string
    description: string | null
    priority: Priority
    dueDate: Date | null
    dueTime: Date | null
    completed: boolean
    completedAt: Date | null
    listId: string | null
    userId: string
    createdAt: Date
    updatedAt: Date
  }): Task {
    return Task.reconstitute({
      id: prismaTask.id,
      title: new TaskTitle(prismaTask.title),
      description: prismaTask.description ?? undefined,
      priority: prismaTask.priority,
      dueDate: prismaTask.dueDate ?? undefined,
      dueTime: prismaTask.dueTime ?? undefined,
      completed: prismaTask.completed,
      completedAt: prismaTask.completedAt ?? undefined,
      listId: prismaTask.listId ?? undefined,
      userId: prismaTask.userId,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
    })
  }
}
