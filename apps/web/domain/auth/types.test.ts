import { describe, it, expect } from 'vitest'
import { parseUser, parseAuthResponse } from './types'

const validUserPayload = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  name: 'John Doe',
  email: 'john@example.com',
}

const validAuthPayload = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
  user: validUserPayload,
}

describe('parseUser', () => {
  it('parses a valid user', () => {
    const user = parseUser(validUserPayload)

    expect(user.id).toBe('a1b2c3d4-e5f6-4890-abcd-ef1234567890')
    expect(user.name).toBe('John Doe')
    expect(user.email).toBe('john@example.com')
  })

  it('throws on invalid email', () => {
    const payload = { ...validUserPayload, email: 'not-an-email' }
    expect(() => parseUser(payload)).toThrow()
  })

  it('throws on missing required field', () => {
    const payload = { ...validUserPayload }
    // @ts-expect-error — intentionally setting required field to undefined
    payload.name = undefined
    expect(() => parseUser(payload)).toThrow()
  })
})

describe('parseAuthResponse', () => {
  it('parses a valid auth response', () => {
    const auth = parseAuthResponse(validAuthPayload)

    expect(auth.accessToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test')
    expect(auth.refreshToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh')
    expect(auth.user.name).toBe('John Doe')
    expect(auth.user.email).toBe('john@example.com')
  })

  it('throws on missing token', () => {
    const payload = { ...validAuthPayload }
    // @ts-expect-error — intentionally setting required field to undefined
    payload.accessToken = undefined
    expect(() => parseAuthResponse(payload)).toThrow()
  })
})
