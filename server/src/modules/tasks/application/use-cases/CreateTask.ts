import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'
import type { Priority } from '../../domain/types/Priority'
import crypto from 'crypto'
import type { FastifyBaseLogger } from 'fastify'
import { getLogger } from '@shared/utils/logger'

interface CreateTaskRequest {
  userId: string
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  dueTime?: string
  dueTimezone: string
  listId?: string
}

interface CreateTaskResponse {
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
  createdAt: Date
  updatedAt: Date
}

export class CreateTask {
  private logger: FastifyBaseLogger

  constructor(private readonly taskRepository: ITaskRepository) {
    this.logger = getLogger('CreateTask')
  }

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const startTime = Date.now()
    const correlationId = crypto.randomUUID()

    this.logger.info({
      action: 'CreateTask.start',
      correlationId,
      userId: request.userId,
      title: request.title,
    }, 'Creating task')

    try {
      const task = Task.create(
        request.userId,
        request.title,
        request.description,
        request.priority,
        request.dueDate,
        request.dueTime,
        request.dueTimezone,
        request.listId,
      )

      const created = await this.taskRepository.create({
        id: task.id,
        title: task.title.value,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        dueTimezone: task.dueTimezone,
        completed: task.completed,
        listId: task.listId,
        userId: task.userId,
      })

      const duration = Date.now() - startTime
      this.logger.info({
        action: 'CreateTask.success',
        correlationId,
        userId: request.userId,
        taskId: created.id,
        duration,
      }, 'Task created successfully')

      return this.toResponse(created)
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error({
        action: 'CreateTask.error',
        correlationId,
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }, 'Failed to create task')
      throw error
    }
  }

  private toResponse(task: Task): CreateTaskResponse {
    return {
      id: task.id,
      title: task.title.value,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      dueTimezone: task.dueTimezone,
      completed: task.completed,
      completedAt: task.completedAt,
      listId: task.listId,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}