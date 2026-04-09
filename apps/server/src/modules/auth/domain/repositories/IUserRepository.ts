export interface IUser {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>
  findById(id: string): Promise<IUser | null>
  create(data: {
    id: string
    name: string
    email: string
    passwordHash: string
  }): Promise<IUser>
  save(user: IUser): Promise<IUser>
}
