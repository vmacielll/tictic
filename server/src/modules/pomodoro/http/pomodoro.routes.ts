import { type FastifyInstance } from 'fastify'

export async function pomodoroRoutes(app: FastifyInstance) {
  const controller = app.pomodoroController

  // Start a new Pomodoro session
  app.post('/pomodoro', { preHandler: [app.authenticate] }, async (request, reply) => {
    return controller.start(request, reply)
  })

  // Get active Pomodoro session
  app.get('/pomodoro/active', { preHandler: [app.authenticate] }, async (request, reply) => {
    return controller.getActive(request, reply)
  })

  // List all Pomodoro sessions
  app.get('/pomodoro', { preHandler: [app.authenticate] }, async (request, reply) => {
    return controller.list(request, reply)
  })

  // Complete a Pomodoro session
  app.patch('/pomodoro/:id/complete', { preHandler: [app.authenticate] }, async (request, reply) => {
    return controller.complete(request, reply)
  })

  // Cancel a Pomodoro session
  app.patch('/pomodoro/:id/cancel', { preHandler: [app.authenticate] }, async (request, reply) => {
    return controller.cancel(request, reply)
  })
}
