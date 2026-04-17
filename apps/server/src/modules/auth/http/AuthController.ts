import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { RegisterUser } from '../application/use-cases/RegisterUser'
import { LoginUser } from '../application/use-cases/LoginUser'
import { AppError } from '../../../shared/errors/AppError'
import { handleError } from '../../../shared/utils/handleError'

export class AuthController {
  private registerUser: RegisterUser
  private loginUser: LoginUser

  constructor(
    registerUser: RegisterUser,
    loginUser: LoginUser,
  ) {
    this.registerUser = registerUser
    this.loginUser = loginUser
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const { name, email, password } = request.body as { name: string; email: string; password: string }

    try {
      const result = await this.registerUser.execute({ name, email, password })
      return reply.status(201).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as { email: string; password: string }

    try {
      const result = await this.loginUser.execute({ email, password })
      return reply.status(200).send(result)
    } catch (error) {
      return handleError(error, reply)
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')
      }

      const decoded = request.server.jwt.verify(token) as { sub: string }

      const accessToken = request.server.jwt.sign({ sub: decoded.sub })

      const refreshToken = request.server.jwt.sign({ sub: decoded.sub }, { expiresIn: '7d' })

      return reply.status(200).send({ accessToken, refreshToken })
    } catch (error) {
      return handleError(error, reply)
    }
  }
}
