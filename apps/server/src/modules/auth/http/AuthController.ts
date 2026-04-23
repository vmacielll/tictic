import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { RegisterUser } from '../application/use-cases/RegisterUser'
import { LoginUser } from '../application/use-cases/LoginUser'
import { AppError } from '../../../shared/errors/AppError'
import { handleError } from '../../../shared/utils/handleError'
import { validationError } from '../../../shared/utils/validationError'
import { RegisterSchema, LoginSchema } from './schemas'
import type { IUserRepository } from '../domain/repositories/IUserRepository'

export class AuthController {
  private registerUser: RegisterUser
  private loginUser: LoginUser
  private userRepository: IUserRepository

  constructor(
    registerUser: RegisterUser,
    loginUser: LoginUser,
    userRepository: IUserRepository,
  ) {
    this.registerUser = registerUser
    this.loginUser = loginUser
    this.userRepository = userRepository
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
      const result = await this.loginUser.execute({ email, password }, reply)
      return reply.status(200).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const accessToken = request.cookies.accessToken
      const refreshToken = request.cookies.refreshToken

      if (!refreshToken) {
        throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')
      }

      const decoded = request.server.jwt.verify(refreshToken) as { sub: string }

      const newAccessToken = request.server.jwt.sign({ sub: decoded.sub })
      const newRefreshToken = request.server.jwt.sign({ sub: decoded.sub }, { expiresIn: '7d' })

      reply.setCookie('accessToken', newAccessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15,
      })

      reply.setCookie('refreshToken', newRefreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })

      return reply.status(200).send({ accessToken: newAccessToken })
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
