import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { PomodoroSession } from '../../domain/entities/PomodoroSession'
import { AppError } from '@shared/errors/AppError'

interface StartPomodoroRequest {
  userId: string
  duration: number
  taskId?: string
}

interface StartPomodoroResponse {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  status: string
}

export class StartPomodoro {
  constructor(private readonly pomodoroRepository: IPomodoroRepository) {}

  async execute(request: StartPomodoroRequest): Promise<StartPomodoroResponse> {
    // Check for active session
    const activeSession = await this.pomodoroRepository.findActiveByUserId(
      request.userId,
    )
    if (activeSession) {
      throw new AppError('You already have an active Pomodoro session running', 409, 'ACTIVE_SESSION_EXISTS')
    }

    const session = PomodoroSession.create(
      request.userId,
      request.duration,
      request.taskId,
    )

    const created = await this.pomodoroRepository.create({
      id: session.id,
      userId: session.userId,
      taskId: session.taskId,
      duration: session.duration,
      startedAt: session.startedAt,
      status: session.status,
    })

    return this.toResponse(created)
  }

  private toResponse(session: PomodoroSession): StartPomodoroResponse {
    return {
      id: session.id,
      userId: session.userId,
      taskId: session.taskId,
      duration: session.duration,
      startedAt: session.startedAt.toISOString(),
      status: session.status,
    }
  }
}
