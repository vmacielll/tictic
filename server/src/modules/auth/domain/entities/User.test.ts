import { describe, it, expect } from 'vitest'
import { User } from './User'
import { Password } from '../value-objects/Password'

describe('User Entity', () => {
  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      expect(user.id).toBeDefined()
      expect(user.name).toBe('John Doe')
      expect(user.email.value).toBe('john@example.com')
      expect(user.passwordHash).toBe(passwordHash)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should generate a UUID for the user id', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should set createdAt and updatedAt to current date', async () => {
      const before = new Date()
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)
      const after = new Date()

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should normalize email to lowercase', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'JOHN@EXAMPLE.COM', passwordHash)

      expect(user.email.value).toBe('john@example.com')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute a user from database props', () => {
      const user = User.reconstitute({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashedPassword',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      })

      expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(user.name).toBe('Jane Doe')
      expect(user.email.value).toBe('jane@example.com')
      expect(user.passwordHash).toBe('hashedPassword')
      expect(user.createdAt).toEqual(new Date('2024-01-01'))
      expect(user.updatedAt).toEqual(new Date('2024-01-02'))
    })

    it('should create Email value object from string', () => {
      const user = User.reconstitute({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'JANE@EXAMPLE.COM',
        passwordHash: 'hashedPassword',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      })

      expect(user.email.value).toBe('jane@example.com')
    })
  })

  describe('changeName', () => {
    it('should change the user name', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      // Small delay to ensure updatedAt will be different
      await new Promise((resolve) => setTimeout(resolve, 10))
      const oldUpdatedAt = user.updatedAt

      user.changeName('John Smith')

      expect(user.name).toBe('John Smith')
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime())
    })

    it('should trim the new name', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      user.changeName('  John Smith  ')

      expect(user.name).toBe('John Smith')
    })

    it('should throw error for empty name', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      expect(() => user.changeName('')).toThrow('Name cannot be empty')
    })

    it('should throw error for whitespace-only name', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      expect(() => user.changeName('   ')).toThrow('Name cannot be empty')
    })
  })

  describe('toJSON', () => {
    it('should return user data without password hash', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      const json = user.toJSON()

      expect(json).toEqual({
        id: user.id,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      expect(json).not.toHaveProperty('passwordHash')
    })

    it('should return email as string, not Email object', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      const json = user.toJSON()

      expect(typeof json.email).toBe('string')
      expect(json.email).toBe('john@example.com')
    })
  })

  describe('getters', () => {
    it('should expose id, name, email, passwordHash, createdAt, updatedAt', async () => {
      const passwordHash = await Password.hash('password123')
      const user = User.create('John Doe', 'john@example.com', passwordHash)

      expect(user.id).toBeDefined()
      expect(user.name).toBe('John Doe')
      expect(user.email.value).toBe('john@example.com')
      expect(user.passwordHash).toBe(passwordHash)
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()
    })
  })
})
