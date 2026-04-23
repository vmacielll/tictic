export class Email {
  public readonly value: string

  constructor(value: string) {
    const sanitized = value.toLowerCase().trim()
    if (!this.isValid(sanitized)) {
      throw new Error('Invalid email format')
    }
    this.value = sanitized
  }

  private isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  toString(): string {
    return this.value
  }
}
