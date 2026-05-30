import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'

const TEST_JWT_SECRET = 'test-secret-key-for-integration-tests'

/**
 * Creates a Fastify test app with JWT and CORS pre-configured.
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

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 })
    }
  })

  function generateToken(app: FastifyInstance, userId: string): string {
    return app.jwt.sign({ sub: userId })
  }

  return { app, generateToken }
}
