import { describe, it, expect } from 'vitest'
import { AppError } from './AppError'

describe('AppError', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 404, 'NOT_FOUND')
    
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.name).toBe('AppError')
  })

  it('should maintain prototype chain for instanceof checks', () => {
    const error = new AppError('Test error')
    
    expect(error instanceof AppError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })

  it('should capture stack trace', () => {
    const error = new AppError('Test error')
    
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('AppError')
  })

  it('should have default values for statusCode and code', () => {
    const error = new AppError('Test error')
    
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('BAD_REQUEST')
  })

  it('should be throwable and catchable', () => {
    const throwError = () => {
      throw new AppError('Test error', 500, 'INTERNAL_ERROR')
    }
    
    expect(throwError).toThrow(AppError)
    expect(throwError).toThrow('Test error')
    
    try {
      throwError()
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(500)
      expect((error as AppError).code).toBe('INTERNAL_ERROR')
    }
  })
})
