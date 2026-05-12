export interface IRefreshToken {
  id: string
  tokenHash: string
  userId: string
  expiresAt: Date
  revoked: boolean
  usedAt?: Date
  createdAt: Date
}

export interface IRefreshTokenRepository {
  create(data: {
    id: string
    tokenHash: string
    userId: string
    expiresAt: Date
  }): Promise<IRefreshToken>
  findByTokenHash(tokenHash: string): Promise<IRefreshToken | null>
  revoke(tokenHash: string): Promise<void>
  revokeAllByUserId(userId: string): Promise<void>
  markAsUsed(tokenHash: string): Promise<void>
}
