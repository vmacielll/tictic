import { FastifyInstance } from 'fastify'
import { AuthController } from './AuthController'

export async function authRoutes(app: FastifyInstance) {
  const controller = (app as any).authController as AuthController

  app.post('/auth/register', {}, controller.register.bind(controller))
  app.post('/auth/login', {}, controller.login.bind(controller))
  app.post('/auth/refresh', { preHandler: [(app as any).authenticate] }, controller.refresh.bind(controller))
}
