import { AppError } from './AppError'

export interface HttpErrorResponse {
  message: string
  code: string
  statusCode: number
}

export function toHttpError(error: unknown): HttpErrorResponse {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  // Handle Fastify rate limit errors (they have statusCode property)
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const fastifyError = error as { statusCode: number; message?: string }
    if (fastifyError.statusCode === 429) {
      return {
        message: fastifyError.message || 'Rate limit exceeded, retry later',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
      }
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    }
  }

  return {
    message: 'Unknown error',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  }
}
