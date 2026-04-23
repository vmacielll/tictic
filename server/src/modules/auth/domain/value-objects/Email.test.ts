import { describe, it, expect } from 'vitest'
import { Email } from './Email'

describe('Email Value Object', () => {
  it('should create a valid email with lowercase and trimmed', () => {
    const email = new Email('  User@Example.COM  ')

    expect(email.value).toBe('user@example.com')
    expect(email.toString()).toBe('user@example.com')
  })

  it('should accept a valid email format', () => {
    const email = new Email('test@example.com')

    expect(email.value).toBe('test@example.com')
  })

  it('should throw error for invalid email - missing @', () => {
    expect(() => new Email('invalid-email')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - missing domain', () => {
    expect(() => new Email('test@')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - missing local part', () => {
    expect(() => new Email('@example.com')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - empty string', () => {
    expect(() => new Email('')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - only spaces', () => {
    expect(() => new Email('   ')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - missing TLD', () => {
    expect(() => new Email('test@example')).toThrow('Invalid email format')
  })

  it('should throw error for invalid email - spaces in email', () => {
    expect(() => new Email('te st@example.com')).toThrow('Invalid email format')
  })

  it('should handle emails with subdomains', () => {
    const email = new Email('user@subdomain.example.com')

    expect(email.value).toBe('user@subdomain.example.com')
  })

  it('should handle emails with dots and plus signs', () => {
    const email = new Email('user.name+tag@example.com')

    expect(email.value).toBe('user.name+tag@example.com')
  })
})
