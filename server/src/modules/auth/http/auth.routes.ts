import { FastifyInstance } from 'fastify'
import { AuthController } from './AuthController'

export async function authRoutes(app: FastifyInstance) {
  const controller = app.authController as AuthController

  app.post('/auth/register', controller.register.bind(controller))

  app.post('/auth/login', controller.login.bind(controller))
  
  app.post('/auth/refresh', controller.refresh.bind(controller))

  app.get('/auth/me', { preHandler: [app.authenticate] }, controller.me.bind(controller))

  app.post('/auth/logout', controller.logout.bind(controller))

  app.patch('/auth/profile', { preHandler: [app.authenticate] }, controller.updateProfile.bind(controller))

  app.post('/auth/change-password', { preHandler: [app.authenticate] }, controller.changePassword.bind(controller))

  app.delete('/auth/account', { preHandler: [app.authenticate] }, controller.deleteAccount.bind(controller))
}
