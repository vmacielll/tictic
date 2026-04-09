export interface RegisterUserDTO {
  name: string
  email: string
  password: string
}

export interface LoginUserDTO {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
  }
}
