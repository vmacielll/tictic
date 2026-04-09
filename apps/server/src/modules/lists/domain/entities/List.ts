import { ListName } from '../value-objects/ListName'

export interface ListProps {
  id: string
  name: ListName
  color?: string
  userId: string
  createdAt: Date
}

export class List {
  private readonly _id: string
  private _name: ListName
  private _color?: string
  private readonly _userId: string
  private readonly _createdAt: Date

  private constructor(props: ListProps) {
    this._id = props.id
    this._name = props.name
    this._color = props.color
    this._userId = props.userId
    this._createdAt = props.createdAt
  }

  static create(userId: string, name: string, color?: string): List {
    return new List({
      id: crypto.randomUUID(),
      name: new ListName(name),
      color,
      userId,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: ListProps): List {
    return new List(props)
  }

  updateName(name: string): void {
    this._name = new ListName(name)
  }

  updateColor(color?: string): void {
    this._color = color
  }

  get id(): string { return this._id }
  get name(): ListName { return this._name }
  get color(): string | undefined { return this._color }
  get userId(): string { return this._userId }
  get createdAt(): Date { return this._createdAt }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name.value,
      color: this._color,
      userId: this._userId,
      createdAt: this._createdAt,
    }
  }
}
