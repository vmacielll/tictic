import { Task } from '../../modules/tasks/domain/entities/Task'
import { TaskTitle } from '../../modules/tasks/domain/value-objects/TaskTitle'
import type { Priority } from '../../modules/tasks/domain/types/Priority'

interface PrismaTask {
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
}

export function prismaTaskToDomain(prismaTask: PrismaTask): Task {
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