import { type IPomodoroRepository } from '../../domain/repositories/IPomodoroRepository'
import { type PomodoroSession } from '../../domain/entities/PomodoroSession'

interface ListPomodorosRequest {
  userId: string
}

interface ListPomodorosResponse {
  pomodoroSessions: PomodoroSessionDTO[]
}

interface PomodoroSessionDTO {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt?: string
  status: string
}

export class ListPomodoros {
  constructor(private readonly pomodoroRepository: IPomodoroRepository) {}

  async execute(request: ListPomodorosRequest): Promise<ListPomodorosResponse> {
    const sessions = await this.pomodoroRepository.findByUserId(request.userId)

    return {
      pomodoroSessions: sessions.map((s) => this.toDTO(s)),
    }
  }

  private toDTO(session: PomodoroSession): PomodoroSessionDTO {
    return {
      id: session.id,
      userId: session.userId,
      taskId: session.taskId,
      duration: session.duration,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      status: session.status,
    }
  }
}
