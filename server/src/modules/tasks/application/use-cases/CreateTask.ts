import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import { Task } from '../../domain/entities/Task'
import type { Priority } from '../../domain/types/Priority'

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
  listId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export class CreateTask {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
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

    return this.toResponse(created)
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
      listId: task.listId,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }
}