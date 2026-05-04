import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AuthController } from './AuthController'

export async function authRoutes(app: FastifyInstance) {
  const controller = (app as any).authController as AuthController

  app.post('/auth/register', controller.register.bind(controller))

  app.post('/auth/login', controller.login.bind(controller))
  
  app.post('/auth/refresh', controller.refresh.bind(controller))

  app.get('/auth/me', { preHandler: [(app as any).authenticate] }, controller.me.bind(controller))

  app.post('/auth/logout', controller.logout.bind(controller))
}
