import 'dotenv/config'
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCookie from '@fastify/cookie'
import { prisma } from '@prisma/PrismaClient'
import { isValidTimezone } from '@shared/utils/timezone'

const requiredEnv = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL']
requiredEnv.forEach((v) => {
  if (!process.env[v]) {
    throw new Error(`Missing required env var: ${v}`)
  }
})
import { RegisterUser } from './modules/auth/application/use-cases/RegisterUser'
import { LoginUser } from './modules/auth/application/use-cases/LoginUser'
import { PrismaUserRepository } from './modules/auth/infra/repositories/PrismaUserRepository'
import { AuthController } from './modules/auth/http/AuthController'
import { authRoutes } from './modules/auth/http/auth.routes'
import { CreateTask } from './modules/tasks/application/use-cases/CreateTask'
import { UpdateTask } from './modules/tasks/application/use-cases/UpdateTask'
import { CompleteTask } from './modules/tasks/application/use-cases/CompleteTask'
import { UncompleteTask } from './modules/tasks/application/use-cases/UncompleteTask'
import { DeleteTask } from './modules/tasks/application/use-cases/DeleteTask'
import { ListTasks } from './modules/tasks/application/use-cases/ListTasks'
import { ListTasksByDate } from './modules/tasks/application/use-cases/ListTasksByDate'
import { ListInboxTasks } from './modules/tasks/application/use-cases/ListInboxTasks'
import { PrismaTaskRepository } from './modules/tasks/infra/repositories/PrismaTaskRepository'
import { TasksController } from './modules/tasks/http/TasksController'
import { tasksRoutes } from './modules/tasks/http/tasks.routes'
import { CreateList } from './modules/lists/application/use-cases/CreateList'
import { UpdateList } from './modules/lists/application/use-cases/UpdateList'
import { DeleteList } from './modules/lists/application/use-cases/DeleteList'
import { ListUserLists } from './modules/lists/application/use-cases/ListUserLists'
import { PrismaListRepository } from './modules/lists/infra/repositories/PrismaListRepository'
import { ListsController } from './modules/lists/http/ListsController'
import { listsRoutes } from './modules/lists/http/lists.routes'
import { GetCalendarMonth } from './modules/calendar/application/use-cases/GetCalendarMonth'
import { GetCalendarWeek } from './modules/calendar/application/use-cases/GetCalendarWeek'
import { GetCalendarDay } from './modules/calendar/application/use-cases/GetCalendarDay'
import { CalendarController } from './modules/calendar/http/CalendarController'
import { calendarRoutes } from './modules/calendar/http/calendar.routes'
import { StartPomodoro } from './modules/pomodoro/application/use-cases/StartPomodoro'
import { CompletePomodoro } from './modules/pomodoro/application/use-cases/CompletePomodoro'
import { CancelPomodoro } from './modules/pomodoro/application/use-cases/CancelPomodoro'
import { ListPomodoros } from './modules/pomodoro/application/use-cases/ListPomodoros'
import { GetActivePomodoro } from './modules/pomodoro/application/use-cases/GetActivePomodoro'
import { PrismaPomodoroRepository } from './modules/pomodoro/infra/repositories/PrismaPomodoroRepository'
import { PomodoroController } from './modules/pomodoro/http/PomodoroController'
import { pomodoroRoutes } from './modules/pomodoro/http/pomodoro.routes'
import swaggerPlugin from './plugins/swagger'

const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Middleware: Extract timezone from request headers
app.addHook('preHandler', async (request, _reply) => {
  const timezoneHeader = request.headers['x-timezone'] as string
  const timezone = timezoneHeader && isValidTimezone(timezoneHeader) ? timezoneHeader : 'UTC'
  ;(request as any).userTimezone = timezone
})

// Allow empty body for JSON requests (needed for PATCH/PUT endpoints without body)
app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body: string, done) {
  try {
    const parsed = body === '' ? {} : JSON.parse(body)
    done(null, parsed)
  } catch (err: any) {
    err.statusCode = 400
    done(err, undefined)
  }
})

// CORS
app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})

// Cookie support
app.register(fastifyCookie)

// Rate limiting
app.register(fastifyRateLimit, {
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  timeWindow: '1 minute',
})

// JWT
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
  sign: {
    expiresIn: '15m',
  },
  cookie: {
    cookieName: 'accessToken',
    signed: false,
  },
})

// Auth decorator for protected routes
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Skip CSRF check for requests without Origin header (like curl)
    const origin = request.headers.origin
    if (origin) {
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
      if (origin !== allowedOrigin) {
        return reply.code(403).send({ message: 'Forbidden', code: 'CSRF', statusCode: 403 })
      }
    }

    await request.jwtVerify()
  } catch (err) {
    return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
  }
})

// Register auth use cases
const userRepository = new PrismaUserRepository(prisma)
const registerUser = new RegisterUser(userRepository)
const loginUser = new LoginUser(userRepository, app)
const authController = new AuthController(registerUser, loginUser, userRepository)

// Decorate app with auth controller
app.decorate('authController', authController)

// Register tasks use cases
const taskRepository = new PrismaTaskRepository(prisma)
const createTask = new CreateTask(taskRepository)
const updateTask = new UpdateTask(taskRepository)
const completeTask = new CompleteTask(taskRepository)
const uncompleteTask = new UncompleteTask(taskRepository)
const deleteTask = new DeleteTask(taskRepository)
const listTasks = new ListTasks(taskRepository)
const listTasksByDate = new ListTasksByDate(taskRepository)
const listInboxTasks = new ListInboxTasks(taskRepository)
const tasksController = new TasksController(createTask, updateTask, completeTask, uncompleteTask, deleteTask, listTasks, listTasksByDate, listInboxTasks)
app.decorate('tasksController', tasksController)

// Register lists use cases
const listRepository = new PrismaListRepository(prisma)
const createList = new CreateList(listRepository)
const updateList = new UpdateList(listRepository)
const deleteList = new DeleteList(listRepository)
const listUserLists = new ListUserLists(listRepository)
const listsController = new ListsController(createList, updateList, deleteList, listUserLists)
app.decorate('listsController', listsController)

// Register calendar use cases (uses taskRepository - calendar is a projection of tasks)
const getCalendarMonth = new GetCalendarMonth(taskRepository)
const getCalendarWeek = new GetCalendarWeek(taskRepository)
const getCalendarDay = new GetCalendarDay(taskRepository)
const calendarController = new CalendarController(getCalendarMonth, getCalendarWeek, getCalendarDay)
app.decorate('calendarController', calendarController)

// Register pomodoro use cases
const pomodoroRepository = new PrismaPomodoroRepository(prisma)
const startPomodoro = new StartPomodoro(pomodoroRepository)
const completePomodoro = new CompletePomodoro(pomodoroRepository)
const cancelPomodoro = new CancelPomodoro(pomodoroRepository)
const listPomodoros = new ListPomodoros(pomodoroRepository)
const getActivePomodoro = new GetActivePomodoro(pomodoroRepository)
const pomodoroController = new PomodoroController(
  startPomodoro,
  completePomodoro,
  cancelPomodoro,
  listPomodoros,
  getActivePomodoro,
)
app.decorate('pomodoroController', pomodoroController)

// Register routes
app.register(authRoutes)
app.register(tasksRoutes)
app.register(listsRoutes)
app.register(calendarRoutes)
app.register(pomodoroRoutes)

// Register Swagger documentation
app.register(swaggerPlugin)

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Global error handler
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  return reply.status(500).send({
    message: 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  })
})

const PORT = parseInt(process.env.PORT || '3333', 10)

const start = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect()
    app.log.info('Connected to database')

    await app.listen({ host: '0.0.0.0', port: PORT })
    app.log.info(`Server running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

start()
