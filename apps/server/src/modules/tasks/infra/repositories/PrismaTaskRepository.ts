import type { PrismaClient } from '@prisma/client'
import type { ITaskRepository, PaginationParams } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'
import type { Priority } from '../../domain/types/Priority'
import { prismaTaskToDomain } from '../../../../shared/mappers/prismaTaskMapper'

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
    const prismaTask = await this.prisma.task.create({
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

    return prismaTaskToDomain(prismaTask)
  }

  async findById(id: string): Promise<Task | null> {
    const prismaTask = await this.prisma.task.findUnique({ where: { id } })
    if (!prismaTask) return null
    return prismaTaskToDomain(prismaTask)
  }

  async findByUserId(userId: string, pagination?: PaginationParams): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: pagination?.skip,
      take: pagination?.take,
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findByUserIdAndDate(userId: string, date: Date, pagination?: PaginationParams): Promise<Task[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination?.skip,
      take: pagination?.take,
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { dueDate: 'asc' },
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findInboxByUserId(userId: string): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: null,
      },
      orderBy: { createdAt: 'desc' },
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async save(task: Task): Promise<Task> {
    const prismaTask = await this.prisma.task.update({
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
      },
    })

    return prismaTaskToDomain(prismaTask)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } })
  }
}
