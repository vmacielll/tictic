import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import crypto from 'crypto'
import { RegisterUser } from '../application/use-cases/RegisterUser'
import { LoginUser } from '../application/use-cases/LoginUser'
import { AppError } from '../../../shared/errors/AppError'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { RegisterSchema, LoginSchema } from './schemas'
import type { IUserRepository } from '../domain/repositories/IUserRepository'
import type { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository'

export class AuthController {
  private registerUser: RegisterUser
  private loginUser: LoginUser
  private userRepository: IUserRepository
  private refreshTokenRepository: IRefreshTokenRepository

  constructor(
    registerUser: RegisterUser,
    loginUser: LoginUser,
    userRepository: IUserRepository,
    refreshTokenRepository: IRefreshTokenRepository,
  ) {
    this.registerUser = registerUser
    this.loginUser = loginUser
    this.userRepository = userRepository
    this.refreshTokenRepository = refreshTokenRepository
  }

  private setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
    reply.setCookie('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
    })

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = RegisterSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const { name, email, password } = parseResult.data

    try {
      const result = await this.registerUser.execute({ name, email, password })
      return reply.status(201).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = LoginSchema.safeParse(request.body)
    if (!parseResult.success) {
      return validationError(reply, parseResult.error)
    }
    const { email, password } = parseResult.data

    try {
      const result = await this.loginUser.execute({ email, password })
      this.setAuthCookies(reply, result.accessToken, result.refreshToken)
      return reply.status(200).send({ user: result.user })
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.cookies.refreshToken

      if (!refreshToken) {
        throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')
      }

      // Verify token signature
      const decoded = request.server.jwt.verify(refreshToken) as { sub: string }

      // Check if token exists in database and is not revoked
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash)

      if (!storedToken || storedToken.revoked) {
        throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED')
      }

      if (new Date() > storedToken.expiresAt) {
        await this.refreshTokenRepository.revoke(tokenHash)
        throw new AppError('Refresh token expired', 401, 'UNAUTHORIZED')
      }

      // Generate new tokens
      const newAccessToken = request.server.jwt.sign({ sub: decoded.sub })
      const newRefreshToken = request.server.jwt.sign({ sub: decoded.sub }, { expiresIn: '7d' })

      // Revoke old token and store new one (rotation)
      await this.refreshTokenRepository.revoke(tokenHash)
      const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await this.refreshTokenRepository.create({
        id: crypto.randomUUID(),
        tokenHash: newTokenHash,
        userId: decoded.sub,
        expiresAt: newExpiresAt,
      })

      this.setAuthCookies(reply, newAccessToken, newRefreshToken)

      return reply.status(200).send({ accessToken: newAccessToken })
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.cookies.refreshToken

      if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
        await this.refreshTokenRepository.revoke(tokenHash)
      }

      reply.clearCookie('accessToken', { path: '/' })
      reply.clearCookie('refreshToken', { path: '/' })

      return reply.status(200).send({ message: 'Logged out successfully' })
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
      const userId = (request.user as { sub: string }).sub
      
      const user = await this.userRepository.findById(userId)
      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND')
      }

      return reply.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
      })
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
