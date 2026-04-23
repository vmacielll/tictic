export class ListName {
  public readonly value: string

  constructor(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw new Error('List name cannot be empty')
    }
    if (trimmed.length > 100) {
      throw new Error('List name must be less than 100 characters')
    }
    this.value = trimmed
  }

  toString(): string {
    return this.value
  }
}
