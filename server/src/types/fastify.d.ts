import 'fastify'
import { AuthController } from '../modules/auth/http/AuthController'
import { TasksController } from '../modules/tasks/http/TasksController'
import { ListsController } from '../modules/lists/http/ListsController'
import { CalendarController } from '../modules/calendar/http/CalendarController'
import { PomodoroController } from '../modules/pomodoro/http/PomodoroController'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authController: AuthController
    tasksController: TasksController
    listsController: ListsController
    calendarController: CalendarController
    pomodoroController: PomodoroController
    jwt: {
      sign: (payload: object, options?: object) => string
      verify: (token: string) => { sub: string }
    }
  }

  interface FastifyRequest {
    user: { sub: string }
    userTimezone: string
  }
}
