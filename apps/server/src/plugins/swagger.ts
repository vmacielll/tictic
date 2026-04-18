import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'TickTick API',
        description: 'Task management API with Pomodoro timer support',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${process.env.PORT || 3333}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })
})