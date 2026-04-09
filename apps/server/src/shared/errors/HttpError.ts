export interface HttpErrorResponse {
  message: string
  code: string
  statusCode: number
}

export function toHttpError(error: Error): HttpErrorResponse {
  if ('statusCode' in error && 'code' in error) {
    const appError = error as { message: string; statusCode: number; code: string }
    return {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
    }
  }

  return {
    message: error.message,
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  }
}
