import type { PrismaClient, RefreshToken as PrismaRefreshToken } from '@prisma/client'
import type { IRefreshToken, IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository'

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { id: string; tokenHash: string; userId: string; expiresAt: Date }): Promise<IRefreshToken> {
    const prismaRefreshToken = await this.prisma.refreshToken.create({
      data: {
        id: data.id,
        tokenHash: data.tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
        revoked: false,
      },
    })
    return this.toDomain(prismaRefreshToken)
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    const prismaRefreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    })
    if (!prismaRefreshToken) return null
    return this.toDomain(prismaRefreshToken)
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revoked: true },
    })
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    })
  }

  private toDomain(prisma: PrismaRefreshToken): IRefreshToken {
    return {
      id: prisma.id,
      tokenHash: prisma.tokenHash,
      userId: prisma.userId,
      expiresAt: prisma.expiresAt,
      revoked: prisma.revoked,
      createdAt: prisma.createdAt,
    }
  }
}
