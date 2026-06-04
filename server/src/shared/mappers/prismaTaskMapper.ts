import { Task } from '@modules/tasks/domain/entities/Task'
import { TaskTitle } from '@modules/tasks/domain/value-objects/TaskTitle'
import type { Task as PrismaTask } from '@prisma/client'
import type { Mapper } from './Mapper'

export const prismaTaskMapper: Mapper<Task, PrismaTask> = {
  toDomain(prismaTask: PrismaTask): Task {
    return Task.reconstitute({
      id: prismaTask.id,
      title: new TaskTitle(prismaTask.title),
      description: prismaTask.description ?? undefined,
      priority: prismaTask.priority,
      dueDate: prismaTask.dueDate ?? undefined,
      dueTime: prismaTask.dueTime ?? undefined,
      dueTimezone: prismaTask.dueTimezone ?? undefined,
      completed: prismaTask.completed,
      completedAt: prismaTask.completedAt ?? undefined,
      listId: prismaTask.listId ?? undefined,
      userId: prismaTask.userId,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
    })
  },
  toPrisma(domain: Task): PrismaTask {
    return {
      id: domain.id,
      title: domain.title.value,
      description: domain.description ?? null,
      priority: domain.priority,
      dueDate: domain.dueDate ?? null,
      dueTime: domain.dueTime ?? null,
      dueTimezone: domain.dueTimezone ?? null,
      completed: domain.completed,
      completedAt: domain.completedAt ?? null,
      listId: domain.listId ?? null,
      userId: domain.userId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    } as PrismaTask
  },
}

export function prismaTaskToDomain(prismaTask: PrismaTask): Task {
  return prismaTaskMapper.toDomain(prismaTask)
}