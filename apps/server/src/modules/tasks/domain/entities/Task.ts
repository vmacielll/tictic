import { TaskTitle } from '../value-objects/TaskTitle'
import { Priority } from '../types/Priority'

export interface TaskProps {
  id: string
  title: TaskTitle
  description?: string
  priority: Priority
  dueDate?: Date
  dueTime?: Date
  completed: boolean
  completedAt?: Date
  listId?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export class Task {
  private readonly _id: string
  private _title: TaskTitle
  private _description?: string
  private _priority: Priority
  private _dueDate?: Date
  private _dueTime?: Date
  private _completed: boolean
  private _completedAt?: Date
  private _listId?: string
  private readonly _userId: string
  private readonly _createdAt: Date
  private _updatedAt: Date

  private constructor(props: TaskProps) {
    this._id = props.id
    this._title = props.title
    this._description = props.description
    this._priority = props.priority
    this._dueDate = props.dueDate
    this._dueTime = props.dueTime
    this._completed = props.completed
    this._completedAt = props.completedAt
    this._listId = props.listId
    this._userId = props.userId
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  static create(
    userId: string,
    title: string,
    description?: string,
    priority?: Priority,
    dueDate?: Date,
    dueTime?: Date,
    listId?: string,
  ): Task {
    return new Task({
      id: crypto.randomUUID(),
      title: new TaskTitle(title),
      description,
      priority: priority ?? 'MEDIUM',
      dueDate,
      dueTime,
      completed: false,
      listId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: TaskProps): Task {
    return new Task(props)
  }

  complete(): void {
    if (this._completed) {
      return
    }
    this._completed = true
    this._completedAt = new Date()
    this._updatedAt = new Date()
  }

  uncomplete(): void {
    if (!this._completed) {
      return
    }
    this._completed = false
    this._completedAt = undefined
    this._updatedAt = new Date()
  }

  update(title?: string, description?: string, priority?: Priority, dueDate?: Date, dueTime?: Date, listId?: string): void {
    if (title !== undefined) {
      this._title = new TaskTitle(title)
    }
    if (description !== undefined) {
      this._description = description
    }
    if (priority !== undefined) {
      this._priority = priority
    }
    if (dueDate !== undefined) {
      this._dueDate = dueDate
    }
    if (dueTime !== undefined) {
      this._dueTime = dueTime
    }
    if (listId !== undefined) {
      this._listId = listId
    }
    this._updatedAt = new Date()
  }

  get id(): string { return this._id }
  get title(): TaskTitle { return this._title }
  get description(): string | undefined { return this._description }
  get priority(): Priority { return this._priority }
  get dueDate(): Date | undefined { return this._dueDate }
  get dueTime(): Date | undefined { return this._dueTime }
  get completed(): boolean { return this._completed }
  get completedAt(): Date | undefined { return this._completedAt }
  get listId(): string | undefined { return this._listId }
  get userId(): string { return this._userId }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  isInbox(): boolean {
    return this._dueDate === undefined || this._dueDate === null
  }

  isDueToday(today: Date): boolean {
    if (!this._dueDate) return false
    return (
      this._dueDate.getFullYear() === today.getFullYear() &&
      this._dueDate.getMonth() === today.getMonth() &&
      this._dueDate.getDate() === today.getDate()
    )
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      title: this._title.value,
      description: this._description,
      priority: this._priority,
      dueDate: this._dueDate,
      dueTime: this._dueTime,
      completed: this._completed,
      completedAt: this._completedAt,
      listId: this._listId,
      userId: this._userId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
