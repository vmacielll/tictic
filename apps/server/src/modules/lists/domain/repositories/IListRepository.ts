import type { List } from '../entities/List'

export interface IListRepository {
  create(data: {
    id: string
    name: string
    color?: string
    userId: string
  }): Promise<List>
  findById(id: string): Promise<List | null>
  findByUserId(userId: string): Promise<List[]>
  save(list: List): Promise<List>
  delete(id: string): Promise<void>
}
