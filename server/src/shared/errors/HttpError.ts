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
