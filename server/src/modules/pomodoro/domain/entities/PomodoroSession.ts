import { AppError } from '@shared/errors/AppError'
import { PomodoroStatus } from '../types/PomodoroStatus'

export { PomodoroStatus }

export interface PomodoroSessionProps {
  id: string
  userId: string
  taskId?: string
  duration: number // in minutes
  startedAt: Date
  completedAt?: Date
  status: PomodoroStatus
}

export class PomodoroSession {
  private readonly _id: string
  private readonly _userId: string
  private readonly _taskId?: string
  private readonly _duration: number
  private readonly _startedAt: Date
  private _completedAt?: Date
  private _status: PomodoroStatus

  private constructor(props: PomodoroSessionProps) {
    this._id = props.id
    this._userId = props.userId
    this._taskId = props.taskId
    this._duration = props.duration
    this._startedAt = props.startedAt
    this._completedAt = props.completedAt
    this._status = props.status
  }

  static create(
    userId: string,
    duration: number,
    taskId?: string,
  ): PomodoroSession {
    const id = crypto.randomUUID()
    const startedAt = new Date()

    return new PomodoroSession({
      id,
      userId,
      taskId,
      duration,
      startedAt,
      status: 'RUNNING',
    })
  }

  static reconstitute(props: PomodoroSessionProps): PomodoroSession {
    return new PomodoroSession(props)
  }

  complete(): void {
    if (this._status !== 'RUNNING') {
      throw new AppError('Cannot complete a session that is not running', 400, 'INVALID_STATE')
    }
    this._status = 'COMPLETED'
    this._completedAt = new Date()
  }

  cancel(): void {
    if (this._status !== 'RUNNING') {
      throw new AppError('Cannot cancel a session that is not running', 400, 'INVALID_STATE')
    }
    this._status = 'CANCELLED'
  }

  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
  }

  get taskId(): string | undefined {
    return this._taskId
  }

  get duration(): number {
    return this._duration
  }

  get startedAt(): Date {
    return this._startedAt
  }

  get completedAt(): Date | undefined {
    return this._completedAt
  }

  get status(): PomodoroStatus {
    return this._status
  }

  get isRunning(): boolean {
    return this._status === 'RUNNING'
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED'
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      taskId: this._taskId,
      duration: this._duration,
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt?.toISOString(),
      status: this._status,
    }
  }
}
