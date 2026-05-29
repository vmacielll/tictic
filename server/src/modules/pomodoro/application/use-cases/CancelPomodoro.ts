import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { type PomodoroSession } from '../../domain/entities/PomodoroSession'
import { AppError } from '@shared/errors/AppError'

interface CancelPomodoroRequest {
  sessionId: string
  userId: string
}

interface CancelPomodoroResponse {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt: string | null
  status: string
}

export class CancelPomodoro {
  constructor(private readonly pomodoroRepository: IPomodoroRepository) {}

  async execute(request: CancelPomodoroRequest): Promise<CancelPomodoroResponse> {
    const session = await this.pomodoroRepository.findById(request.sessionId, request.userId)
    if (!session) {
      throw new AppError('Pomodoro session not found', 404, 'POMODORO_NOT_FOUND')
    }

    if (session.userId !== request.userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN')
    }

    session.cancel()

    const updated = await this.pomodoroRepository.save(session)
    return this.toResponse(updated)
  }

  private toResponse(session: PomodoroSession): CancelPomodoroResponse {
    return {
      id: session.id,
      userId: session.userId,
      taskId: session.taskId,
      duration: session.duration,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      status: session.status,
    }
  }
}
