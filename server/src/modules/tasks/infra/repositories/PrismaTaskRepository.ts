import type { PrismaClient } from '@prisma/client'
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { PaginationParams } from '@shared/types/pagination'
import { Task } from '../../domain/entities/Task'
import type { Priority } from '../../domain/types/Priority'
import { prismaTaskToDomain } from '@shared/mappers/prismaTaskMapper'

const MAX_PAGINATION_LIMIT = 100

function normalizePagination(pagination?: PaginationParams): PaginationParams | undefined {
  if (!pagination) return undefined
  const take = Math.min(pagination.take ?? 20, MAX_PAGINATION_LIMIT)
  return { skip: pagination.skip, take }
}

export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    id: string
    title: string
    description?: string
    priority: Priority
    dueDate?: string
    dueTime?: string
    dueTimezone?: string
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
        dueTimezone: data.dueTimezone ?? null,
        completed: Boolean(data.completed),
        completedAt: data.completedAt ?? null,
        listId: data.listId ?? null,
        userId: data.userId,
      },
    })

    return prismaTaskToDomain(prismaTask)
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const prismaTask = await this.prisma.task.findUnique({ where: { id } })
    if (!prismaTask || prismaTask.userId !== userId) return null
    return prismaTaskToDomain(prismaTask)
  }

  async findByUserId(userId: string, pagination?: PaginationParams): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...normalizePagination(pagination),
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findByUserIdAndDate(userId: string, date: string, pagination?: PaginationParams): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: date,
      },
      orderBy: { createdAt: 'desc' },
      ...normalizePagination(pagination),
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { dueDate: 'asc' },
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async findByDueDate(userId: string, date: string): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueDate: date,
      },
      orderBy: { createdAt: 'desc' },
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
        dueTimezone: task.dueTimezone ?? null,
        completed: Boolean(task.completed),
        completedAt: task.completedAt ?? null,
        listId: task.listId ?? null,
      },
    })

    return prismaTaskToDomain(prismaTask)
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.task.delete({ where: { id, userId } })
  }

  async findByListId(userId: string, listId: string, pagination?: PaginationParams): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: { userId, listId },
      orderBy: { createdAt: 'desc' },
      ...normalizePagination(pagination),
    })
    return prismaTasks.map(prismaTaskToDomain)
  }

  async countByListId(userId: string, listId: string): Promise<number> {
    return this.prisma.task.count({ where: { userId, listId } })
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.task.count({ where: { userId } })
  }
}