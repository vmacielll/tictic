export interface CreateListDTO {
  name: string
  color?: string
}

export interface UpdateListDTO {
  name?: string
  color?: string
}

export interface ListResponse {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: string
}
