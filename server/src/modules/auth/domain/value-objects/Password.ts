import bcrypt from 'bcrypt'

export class Password {
  private constructor() {}

  static async hash(plain: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(plain, saltRounds)
  }

  static async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
