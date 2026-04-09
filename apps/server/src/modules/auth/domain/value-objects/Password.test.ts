import { describe, it, expect } from 'vitest'
import { Password } from './Password'

describe('Password Value Object', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'securePassword123'
      const hash = await Password.hash(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
      expect(hash.startsWith('$2b$12$')).toBe(true) // bcrypt format
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'securePassword123'
      const hash1 = await Password.hash(password)
      const hash2 = await Password.hash(password)

      expect(hash1).not.toBe(hash2) // Different salts
    })

    it('should handle empty string password', async () => {
      const hash = await Password.hash('')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'securePassword123'
      const hash = await Password.hash(password)

      const result = await Password.compare(password, hash)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const hash = await Password.hash('securePassword123')

      const result = await Password.compare('wrongPassword', hash)

      expect(result).toBe(false)
    })

    it('should return false for empty password comparison', async () => {
      const hash = await Password.hash('securePassword123')

      const result = await Password.compare('', hash)

      expect(result).toBe(false)
    })

    it('should handle case-sensitive comparison', async () => {
      const password = 'Password123'
      const hash = await Password.hash(password)

      const resultLowerCase = await Password.compare('password123', hash)
      const resultUpperCase = await Password.compare('PASSWORD123', hash)
      const resultExact = await Password.compare(password, hash)

      expect(resultLowerCase).toBe(false)
      expect(resultUpperCase).toBe(false)
      expect(resultExact).toBe(true)
    })
  })
})
