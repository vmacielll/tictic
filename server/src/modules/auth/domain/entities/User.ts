import { Email } from '../value-objects/Email'

export interface UserProps {
  id: string
  name: string
  email: Email
  passwordHash: string
  createdAt: Date
  updatedAt?: Date
  lists?: Array<unknown>
  tasks?: Array<unknown>
  pomodoroSessions?: Array<unknown>
}

export class User {
  private readonly _id: string
  private _name: string
  private _email: Email
  private readonly _passwordHash: string
  private readonly _createdAt: Date
  private _updatedAt: Date

  private constructor(props: UserProps) {
    this._id = props.id
    this._name = props.name
    this._email = props.email
    this._passwordHash = props.passwordHash
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt ?? props.createdAt
  }

  static create(name: string, email: string, passwordHash: string): User {
    const id = crypto.randomUUID()
    const emailVO = new Email(email)
    return new User({
      id,
      name,
      email: emailVO,
      passwordHash,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: {
    id: string
    name: string
    email: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
  }): User {
    return new User({
      id: props.id,
      name: props.name,
      email: new Email(props.email),
      passwordHash: props.passwordHash,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    })
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get email(): Email {
    return this._email
  }

  get passwordHash(): string {
    return this._passwordHash
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  changeName(newName: string): void {
    if (newName.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    this._name = newName.trim()
    this._updatedAt = new Date()
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      email: this._email.toString(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
