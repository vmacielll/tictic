import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest } from './api'

const BASE_URL = 'http://localhost:3333'

beforeEach(() => {
  vi.restoreAllMocks()
  // Clear cookies between tests
  document.cookie.split(';').forEach((c) => {
    const [name] = c.trim().split('=')
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
})

function mockFetch(status = 200, body: unknown = { ok: true }) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-length': JSON.stringify(body).length.toString() }),
    json: async () => body,
  } as Response)
}

function setCsrfCookie(value: string) {
  document.cookie = `csrf_token=${value};path=/`
}

function clearCsrfCookie() {
  document.cookie = 'csrf_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
}

function getFetchHeaders(): Record<string, string> {
  const calls = vi.mocked(global.fetch).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  // fetch(url, { headers, ... })
  return (calls[calls.length - 1][1] as RequestInit).headers as Record<string, string>
}

// ── CSRF token from cookie ──

describe('getCsrfTokenFromCookie', () => {
  it('returns null when cookie is not set', async () => {
    mockFetch()

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBeUndefined()
  })

  it('sends x-csrf-token header when csrf_token cookie is set', async () => {
    mockFetch()
    setCsrfCookie('abc123')

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('abc123')
  })

  it('sends x-csrf-token with the exact cookie value', async () => {
    mockFetch()
    setCsrfCookie('token-value-xyz-456')

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('token-value-xyz-456')
  })
})

// ── State-changing methods include CSRF header ──

const STATE_CHANGING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'] as const

describe.each(STATE_CHANGING_METHODS)('%s requests', (method) => {
  it('includes x-csrf-token header when cookie is set', async () => {
    mockFetch()
    setCsrfCookie('csrf-test-token')

    await apiRequest('/tasks/123', { method, body: method !== 'DELETE' ? JSON.stringify({}) : undefined })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('csrf-test-token')
  })

  it('does not include x-csrf-token header when cookie is missing', async () => {
    mockFetch()
    clearCsrfCookie()

    await apiRequest('/tasks/123', { method, body: method !== 'DELETE' ? JSON.stringify({}) : undefined })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBeUndefined()
  })
})

// ── GET requests do NOT include CSRF header ──

describe('GET requests', () => {
  it('does not include x-csrf-token header even when cookie is set', async () => {
    mockFetch()
    setCsrfCookie('should-not-be-sent')

    await apiRequest('/tasks')

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBeUndefined()
  })
})

// ── Custom headers are preserved alongside CSRF header ──

describe('custom headers', () => {
  it('passes through custom headers alongside x-csrf-token', async () => {
    mockFetch()
    setCsrfCookie('csrf-abc')

    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'x-custom': 'custom-value' },
    })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('csrf-abc')
    expect(headers['x-custom']).toBe('custom-value')
  })

  it('cookie value takes precedence over caller-supplied x-csrf-token header', async () => {
    mockFetch()
    setCsrfCookie('cookie-token')

    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'x-csrf-token': 'explicit-token' },
    })

    const headers = getFetchHeaders()
    // CSRF token from cookie is set after spreading custom headers, so it wins.
    // This is a security property: callers cannot override the CSRF token.
    expect(headers['x-csrf-token']).toBe('cookie-token')
  })
})

// ── Edge cases ──

describe('edge cases', () => {
  it('handles cookie with special regex characters in value', async () => {
    mockFetch()
    setCsrfCookie('token.with.dots-and-dashes')

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('token.with.dots-and-dashes')
  })

  it('reads correct cookie when multiple cookies exist', async () => {
    mockFetch()
    document.cookie = 'other=value;path=/'
    setCsrfCookie('correct-token')
    document.cookie = 'another=thing;path=/'

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('correct-token')
  })
})

// ── Via exported endpoint functions (integration-style) ──

import { createTask, updateTask, deleteTask, listTasks, getTask } from './api'

describe('exported endpoint functions', () => {
  it('createTask sends x-csrf-token', async () => {
    mockFetch(201, { id: '1', title: 'test' })
    setCsrfCookie('csrf-create')

    await createTask({ title: 'New task' })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('csrf-create')
  })

  it('updateTask sends x-csrf-token', async () => {
    mockFetch(200, { id: '1', title: 'updated' })
    setCsrfCookie('csrf-update')

    await updateTask('1', { title: 'Updated' })

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('csrf-update')
  })

  it('deleteTask sends x-csrf-token', async () => {
    mockFetch(204, null)
    setCsrfCookie('csrf-delete')

    await deleteTask('1')

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBe('csrf-delete')
  })

  it('listTasks does NOT send x-csrf-token (GET)', async () => {
    mockFetch(200, [])
    setCsrfCookie('should-not-send')

    await listTasks()

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBeUndefined()
  })

  it('getTask does NOT send x-csrf-token (GET)', async () => {
    mockFetch(200, { id: '1' })
    setCsrfCookie('also-not-sent')

    await getTask('1')

    const headers = getFetchHeaders()
    expect(headers['x-csrf-token']).toBeUndefined()
  })
})
