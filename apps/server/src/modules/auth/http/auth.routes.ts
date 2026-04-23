import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AuthController } from './AuthController'

export async function authRoutes(app: FastifyInstance) {
  const controller = (app as any).authController as AuthController

  app.post('/auth/register', {
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    }
  }, controller.register.bind(controller))
  
  app.post('/auth/login', {
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    }
  }, controller.login.bind(controller))
  
  app.post('/auth/refresh', controller.refresh.bind(controller))

  app.get('/auth/me', { preHandler: [(app as any).authenticate] }, controller.me.bind(controller))

  app.post('/auth/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('accessToken', { path: '/' })
    reply.clearCookie('refreshToken', { path: '/' })
    return reply.status(200).send({ message: 'Logged out' })
  })
}
