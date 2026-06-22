import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { isValidTimezone } from '@shared/utils/timezone'

const TEST_JWT_SECRET = 'test-secret-key-for-integration-tests'

/**
 * Creates a Fastify test app with JWT, CORS, and timezone pre-configured.
 * Returns the app instance + a token generator helper.
 *
 * Usage:
 *   const { app, generateToken } = await createTestApp()
 *   // Register module-specific use cases, controllers, and routes...
 *   await app.ready()
 *   const userToken = generateToken(app, 'test-user-1')
 */
export async function createTestApp(): Promise<{
  app: FastifyInstance
  generateToken: (app: FastifyInstance, userId: string) => string
}> {
  const app = Fastify({ logger: false })

  await app.register(fastifyCors, { origin: '*' })
  await app.register(fastifyJwt, { secret: TEST_JWT_SECRET })

  // Extract timezone from request headers (mirrors production app.ts)
  app.addHook('preHandler', async (request: any) => {
    const timezoneHeader = request.headers['x-timezone'] as string
    request.userTimezone = timezoneHeader && isValidTimezone(timezoneHeader) ? timezoneHeader : 'UTC'
  })

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
      const token = request.user as { sub: string; iat: number }
      request.userId = token.sub
      request.tokenIssuedAt = token.iat
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  function generateToken(app: FastifyInstance, userId: string): string {
    return app.jwt.sign({ sub: userId })
  }

  return { app, generateToken }
}
