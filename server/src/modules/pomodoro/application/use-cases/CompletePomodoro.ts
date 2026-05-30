import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { type PomodoroSession } from '../../domain/entities/PomodoroSession'
import { AppError } from '@shared/errors/AppError'
import { ensureOwnership } from '@shared/utils/authorize'

interface CompletePomodoroRequest {
  sessionId: string
  userId: string
}

interface CompletePomodoroResponse {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt: string
  status: string
}

export class CompletePomodoro {
  constructor(private readonly pomodoroRepository: IPomodoroRepository) {}

  async execute(
    request: CompletePomodoroRequest,
  ): Promise<CompletePomodoroResponse> {
    const session = await this.pomodoroRepository.findById(request.sessionId, request.userId)
    if (!session) {
      throw new AppError('Pomodoro session not found', 404, 'POMODORO_NOT_FOUND')
    }

    ensureOwnership(session, request.userId, 'session')

    session.complete()

    const updated = await this.pomodoroRepository.save(session)
    return this.toResponse(updated)
  }

  private toResponse(session: PomodoroSession): CompletePomodoroResponse {
    return {
      id: session.id,
      userId: session.userId,
      taskId: session.taskId,
      duration: session.duration,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt!.toISOString(),
      status: session.status,
    }
  }
}
