import { describe, it, expect } from 'vitest'
import { AppError } from './AppError'

describe('AppError', () => {
  it('should create an AppError with default values', () => {
    const error = new AppError('Something went wrong')

    expect(error.message).toBe('Something went wrong')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.name).toBe('AppError')
    expect(error).toBeInstanceOf(Error)
  })

  it('should create an AppError with custom status code', () => {
    const error = new AppError('Not found', 404, 'NOT_FOUND')

    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should create an AppError for unauthorized', () => {
    const error = new AppError('Unauthorized', 401, 'UNAUTHORIZED')

    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('should create an AppError for forbidden', () => {
    const error = new AppError('Forbidden', 403, 'FORBIDDEN')

    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })

  it('should create an AppError for internal server error', () => {
    const error = new AppError('Internal error', 500, 'INTERNAL_SERVER_ERROR')

    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('should create an AppError for conflict', () => {
    const error = new AppError('Conflict', 409, 'CONFLICT')

    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('CONFLICT')
  })

  it('should preserve the stack trace', () => {
    const error = new AppError('Test error')

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('AppError')
  })
})
