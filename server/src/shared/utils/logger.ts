import { FastifyBaseLogger } from 'fastify'
import pino from 'pino'

let fastifyLogger: FastifyBaseLogger | null = null

/**
 * Initialize the shared logger with the Fastify logger instance.
 * Must be called once during app initialization.
 */
export function initializeLogger(logger: FastifyBaseLogger) {
  fastifyLogger = logger
}

/**
 * Reset the logger (for testing purposes).
 */
export function resetLogger() {
  fastifyLogger = null
}

/**
 * Get a logger instance with the specified context.
 * Returns a child logger that includes the context in all log entries.
 */
export function getLogger(context: string): FastifyBaseLogger {
  if (!fastifyLogger) {
    // For testing: create a basic pino logger if not initialized
    fastifyLogger = pino({
      level: 'silent', // Silent in tests
    })
  }
  return fastifyLogger.child({ context })
}
