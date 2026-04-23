export class TaskTitle {
  public readonly value: string

  constructor(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw new Error('Task title cannot be empty')
    }
    if (trimmed.length > 255) {
      throw new Error('Task title must be less than 255 characters')
    }
    this.value = trimmed
  }

  toString(): string {
    return this.value
  }
}
