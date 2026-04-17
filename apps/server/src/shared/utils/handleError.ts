import { FastifyReply } from 'fastify';
import { toHttpError } from '../errors/HttpError';

/**
 * Centralized error handling for Fastify controllers.
 *
 * - Delegates to `toHttpError` for known AppError shapes.
 * - In development mode, includes the stack trace for easier debugging.
 * - Returns the appropriate HTTP status code.
 */
export function handleError(error: unknown, reply: FastifyReply) {
  const httpError = toHttpError(error as Error);
  const response = {
    ...httpError,
    ...(process.env.NODE_ENV === 'development' && (error as Error).stack ? { stack: (error as Error).stack } : {}),
  };
  return reply.status(httpError.statusCode).send(response);
}
