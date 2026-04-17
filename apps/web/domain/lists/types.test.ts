import { describe, it, expect } from 'vitest'
import { parseList, parseLists } from './types'

const validPayload = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  name: 'Work',
  color: '#ff5722',
  userId: 'b2c3d4e5-f6a7-4901-8cde-f12345678901',
  createdAt: '2026-04-09T10:00:00Z',
}

describe('parseList', () => {
  it('parses a valid list', () => {
    const list = parseList(validPayload)

    expect(list.id).toBe('a1b2c3d4-e5f6-4890-abcd-ef1234567890')
    expect(list.name).toBe('Work')
    expect(list.color).toBe('#ff5722')
    expect(list.createdAt).toBeInstanceOf(Date)
  })

  it('handles optional color as undefined', () => {
    const payload = { ...validPayload, color: undefined }
    const list = parseList(payload)
    expect(list.color).toBeUndefined()
  })

  it('throws on missing required field', () => {
    const payload = { ...validPayload }
    // @ts-expect-error — intentionally setting required field to undefined
    payload.name = undefined
    expect(() => parseList(payload)).toThrow()
  })
})

describe('parseLists', () => {
  it('parses an array of lists', () => {
    const lists = parseLists([validPayload, { ...validPayload, id: 'd4e5f6a7-b8c9-4123-8efa-234567890123' }])

    expect(lists).toHaveLength(2)
    expect(lists[0].createdAt).toBeInstanceOf(Date)
  })
})
