import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import crypto from 'crypto'
import { RegisterUser } from '../application/use-cases/RegisterUser'
import { LoginUser } from '../application/use-cases/LoginUser'
import { RefreshToken } from '../application/use-cases/RefreshToken'
import { AppError } from '../../../shared/errors/AppError'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { RegisterSchema, LoginSchema } from './schemas'
import type { IUserRepository } from '../domain/repositories/IUserRepository'
import type { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository'

export class AuthController {
  private registerUser: RegisterUser
  private loginUser: LoginUser
  private refreshToken: RefreshToken
  private userRepository: IUserRepository
  private refreshTokenRepository: IRefreshTokenRepository

  constructor(
    registerUser: RegisterUser,
    loginUser: LoginUser,
    refreshToken: RefreshToken,
    userRepository: IUserRepository,
    refreshTokenRepository: IRefreshTokenRepository,
  ) {
    this.registerUser = registerUser
    this.loginUser = loginUser
    this.refreshToken = refreshToken
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
      
      // Set CSRF token cookie
      const csrfToken = crypto.randomBytes(32).toString('hex')
      reply.setCookie('csrf_token', csrfToken, {
        path: '/',
        httpOnly: false,  // Must be readable by JavaScript
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 hours
      })
      
      this.setAuthCookies(reply, result.accessToken, result.refreshToken)
      return reply.status(200).send({ user: result.user, csrfToken })
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

      const result = await this.refreshToken.execute(refreshToken)
      
      // Set CSRF token cookie
      const csrfToken = crypto.randomBytes(32).toString('hex')
      reply.setCookie('csrf_token', csrfToken, {
        path: '/',
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
      })
      
      this.setAuthCookies(reply, result.accessToken, result.refreshToken)

      return reply.status(200).send({ accessToken: result.accessToken, csrfToken })
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
