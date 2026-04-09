import { describe, it, expect } from 'vitest'
import { toHttpError } from './HttpError'
import { AppError } from './AppError'

describe('toHttpError', () => {
  it('should convert AppError to HTTP error response', () => {
    const appError = new AppError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS')

    const result = toHttpError(appError)

    expect(result).toEqual({
      message: 'Email already registered',
      code: 'EMAIL_ALREADY_EXISTS',
      statusCode: 409,
    })
  })

  it('should convert generic Error to HTTP 500', () => {
    const error = new Error('Something went wrong')

    const result = toHttpError(error)

    expect(result).toEqual({
      message: 'Something went wrong',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    })
  })

  it('should handle AppError with custom message', () => {
    const appError = new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')

    const result = toHttpError(appError)

    expect(result).toEqual({
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    })
  })

  it('should handle validation errors (400)', () => {
    const appError = new AppError('Invalid email format', 400, 'VALIDATION_ERROR')

    const result = toHttpError(appError)

    expect(result).toEqual({
      message: 'Invalid email format',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    })
  })

  it('should handle not found errors (404)', () => {
    const appError = new AppError('User not found', 404, 'USER_NOT_FOUND')

    const result = toHttpError(appError)

    expect(result).toEqual({
      message: 'User not found',
      code: 'USER_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('should handle errors with special characters in message', () => {
    const appError = new AppError("Error: can't process request", 500, 'PROCESSING_ERROR')

    const result = toHttpError(appError)

    expect(result).toEqual({
      message: "Error: can't process request",
      code: 'PROCESSING_ERROR',
      statusCode: 500,
    })
  })
})
