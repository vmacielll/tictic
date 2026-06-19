import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest, clearTokens, triggerAuthError, registerAuthErrorCallback } from './api'

const BASE_URL = 'http://localhost:3333'

beforeEach(() => {
  vi.restoreAllMocks()
  // Clear localStorage between tests
  localStorage.clear()
})

function mockFetch(status = 200, body: unknown = { ok: true }) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-length': JSON.stringify(body).length.toString() }),
    json: async () => body,
  } as Response)
}

function getFetchHeaders(): Record<string, string> {
  const calls = vi.mocked(global.fetch).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return (calls[calls.length - 1][1] as RequestInit).headers as Record<string, string>
}

function login() {
  localStorage.setItem('accessToken', 'test-access-token')
  localStorage.setItem('refreshToken', 'test-refresh-token')
}

// ── Bearer token ──

describe('Authorization header', () => {
  it('sends Bearer token when accessToken is in localStorage', async () => {
    login()
    mockFetch()

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('does not send Authorization header when no token in localStorage', async () => {
    mockFetch()

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}) })

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBeUndefined()
  })

  it('sends Authorization header on GET requests', async () => {
    login()
    mockFetch()

    await apiRequest('/tasks')

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })
})

// ── Custom headers ──

describe('custom headers', () => {
  it('passes through custom headers alongside Authorization', async () => {
    login()
    mockFetch()

    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'x-custom': 'custom-value' },
    })

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
    expect(headers['x-custom']).toBe('custom-value')
  })
})

// ── Token refresh ──

describe('token refresh', () => {
  it('attempts refresh on 401 and retries when requiresAuth is true', async () => {
    login()
    vi.spyOn(global, 'fetch')
      // First call: tasks → 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ message: 'Token expired', code: 'UNAUTHORIZED' }),
      } as Response)
      // Second call: refresh → 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      } as Response)
      // Third call: tasks retry → 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '10' }),
        json: async () => ({ id: '1', title: 'task' }),
      } as Response)

    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}), requiresAuth: true })

    // Verify refresh was called
    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls[1][0]).toContain('/auth/refresh')
    expect(calls[2][0]).toContain('/tasks')
  })

  it('does not refresh on 401 when requiresAuth is false', async () => {
    login()
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

    await expect(
      apiRequest('/auth/me', { requiresAuth: false })
    ).rejects.toThrow()

    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls.length).toBe(1) // No refresh call
  })

  it('does not retry refresh more than once', async () => {
    login()
    vi.spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

    await expect(
      apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}), requiresAuth: true })
    ).rejects.toThrow()

    // Should have: 1 task call + 1 refresh call (from the retry). Total 2, not 3+.
    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls.length).toBeLessThanOrEqual(2)
  })

  it('clears session once when refresh succeeds but retry also gets 401', async () => {
    login()
    // Register auth error callback to verify it's called exactly once
    const authErrorSpy = vi.fn()
    const unregister = registerAuthErrorCallback(authErrorSpy)

    vi.spyOn(global, 'fetch')
      // 1st: initial request → 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ message: 'Token expired', code: 'UNAUTHORIZED' }),
      } as Response)
      // 2nd: refresh → 200 (succeeds)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      } as Response)
      // 3rd: retry with new token → 401 (fails again)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ message: 'Token expired', code: 'UNAUTHORIZED' }),
      } as Response)

    await expect(
      apiRequest('/tasks', { method: 'POST', body: JSON.stringify({}), requiresAuth: true })
    ).rejects.toThrow('Session expired')

    // Should have exactly 3 calls: task, refresh, retry — no infinite loop
    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls.length).toBe(3)

    // triggerAuthError called exactly once (not double)
    expect(authErrorSpy).toHaveBeenCalledTimes(1)

    // Tokens should be cleared
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()

    unregister()
  })

  it('triggers auth error on 401 when no token exists (unauthenticated user)', async () => {
    // No login() — simulates unauthenticated user navigating directly to a protected route
    const authErrorSpy = vi.fn()
    const unregister = registerAuthErrorCallback(authErrorSpy)

    mockFetch(401, { message: 'Unauthorized' })

    await expect(
      apiRequest('/tasks', { requiresAuth: true })
    ).rejects.toThrow('Session expired')

    expect(authErrorSpy).toHaveBeenCalledTimes(1)
    // No refresh attempt should have been made — only the original request
    expect(vi.mocked(global.fetch).mock.calls.length).toBe(1)

    unregister()
  })
})

// ── clearTokens ──

describe('clearTokens', () => {
  it('removes both tokens from localStorage', () => {
    login()
    clearTokens()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})

// ── Exported endpoint functions ──

import { createTask, updateTask, deleteTask, listTasks, getTask, updateProfile, changePassword, deleteAccount } from './api'

describe('exported endpoint functions', () => {
  it('createTask sends Authorization header', async () => {
    login()
    mockFetch(201, { id: '1', title: 'test' })

    await createTask({ title: 'New task' })

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('updateTask sends Authorization header', async () => {
    login()
    mockFetch(200, { id: '1', title: 'updated' })

    await updateTask('1', { title: 'Updated' })

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('deleteTask sends Authorization header', async () => {
    login()
    mockFetch(204, null)

    await deleteTask('1')

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('listTasks sends Authorization header when logged in', async () => {
    login()
    mockFetch(200, [])

    await listTasks()

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  it('getTask sends Authorization header when logged in', async () => {
    login()
    mockFetch(200, { id: '1' })

    await getTask('1')

    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
  })

  // ── Profile & Account functions ──

  it('updateProfile sends PATCH to /auth/profile with name', async () => {
    login()
    mockFetch(200, { id: '1', name: 'New Name', email: 'test@example.com' })

    const result = await updateProfile('New Name')

    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls[0][0]).toContain('/auth/profile')
    expect((calls[0][1] as RequestInit).method).toBe('PATCH')
    expect(JSON.parse((calls[0][1] as RequestInit).body as string)).toEqual({ name: 'New Name' })
    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
    expect(result).toEqual({ id: '1', name: 'New Name', email: 'test@example.com' })
  })

  it('changePassword sends POST to /auth/change-password with current and new password', async () => {
    login()
    mockFetch(200, { message: 'Password changed' })

    const result = await changePassword('oldPass123', 'newPass123')

    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls[0][0]).toContain('/auth/change-password')
    expect((calls[0][1] as RequestInit).method).toBe('POST')
    expect(JSON.parse((calls[0][1] as RequestInit).body as string)).toEqual({
      currentPassword: 'oldPass123',
      newPassword: 'newPass123',
    })
    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
    expect(result).toEqual({ message: 'Password changed' })
  })

  it('deleteAccount sends DELETE to /auth/account with password', async () => {
    login()
    mockFetch(200, { message: 'Account deleted' })

    const result = await deleteAccount('myPassword')

    const calls = vi.mocked(global.fetch).mock.calls
    expect(calls[0][0]).toContain('/auth/account')
    expect((calls[0][1] as RequestInit).method).toBe('DELETE')
    expect(JSON.parse((calls[0][1] as RequestInit).body as string)).toEqual({
      password: 'myPassword',
    })
    const headers = getFetchHeaders()
    expect(headers['Authorization']).toBe('Bearer test-access-token')
    expect(result).toEqual({ message: 'Account deleted' })
  })
})
