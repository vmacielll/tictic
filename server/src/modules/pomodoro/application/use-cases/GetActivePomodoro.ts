import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { type PomodoroSession } from '../../domain/entities/PomodoroSession'

interface GetActivePomodoroRequest {
  userId: string
}

interface GetActivePomodoroResponse {
  pomodoroSession?: PomodoroSessionDTO
}

interface PomodoroSessionDTO {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt: string | null
  status: string
}

export class GetActivePomodoro {
  constructor(private readonly pomodoroRepository: IPomodoroRepository) {}

  async execute(
    request: GetActivePomodoroRequest,
  ): Promise<GetActivePomodoroResponse> {
    const session = await this.pomodoroRepository.findActiveByUserId(
      request.userId,
    )

    if (!session) {
      return {}
    }

    return {
      pomodoroSession: this.toDTO(session),
    }
  }

  private toDTO(session: PomodoroSession): PomodoroSessionDTO {
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
