import type { AuthResponse } from '@/domain/auth/types'
import type { CalendarDay, CalendarDayDetail } from '@/domain/calendar/types'
import type { List } from '@/domain/lists/types'
import type { PomodoroSession, StartPomodoroInput } from '@/domain/pomodoro/types'
import type { TaskResponse, CreateTaskInput, UpdateTaskInput } from '@/domain/tasks/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// ── Auth error callback ──
// Registered by AuthContext to handle expired/invalid tokens globally
let onAuthError: (() => void) | null = null

export function registerAuthErrorCallback(callback: () => void): () => void {
  onAuthError = callback
  return () => { onAuthError = null }
}

export function triggerAuthError(): void {
  if (onAuthError) onAuthError()
}

// ── Token storage ──
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
  _retry?: boolean
  signal?: AbortSignal
}

function parseServerError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Unknown error'

  const e = error as Record<string, unknown>

  if (e.details && typeof e.details === 'object') {
    const details = e.details as Record<string, string[]>
    const messages = Object.entries(details).flatMap(([field, msgs]) =>
      msgs.map((msg) => `${field}: ${msg}`)
    )
    return messages.join(', ')
  }

  return (e.message as string) || 'Request failed'
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = false, headers: customHeaders, _retry = false, ...restOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': typeof window !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
    ...(customHeaders as Record<string, string>),
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
    })

    if (response.status === 401 && requiresAuth && token) {
      // Attempt token refresh on first 401, then fall through to force logout
      if (!_retry) {
        try {
          await refreshToken()
          return apiRequest<T>(endpoint, { ...restOptions, requiresAuth, headers, _retry: true })
        } catch {
          // refresh failed — fall through to clear session
        }
      }
      clearTokens()
      triggerAuthError()
      throw new Error('Session expired')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed', code: 'UNKNOWN' }))
      throw new Error(parseServerError(error))
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as unknown as T
    }

    return response.json() as Promise<T>
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return undefined as unknown as T
    }
    throw error
  }
}

async function refreshToken(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    clearTokens()
    throw new Error('Failed to refresh token')
  }
  const data = await response.json()
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  clearTokens()
}

export async function getMe(): Promise<{ id: string; name: string; email: string }> {
  return apiRequest('/auth/me', { requiresAuth: true })
}

// ── Auth ──
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(response.accessToken)
  setRefreshToken(response.refreshToken)
  return response
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

// ── Calendar ──
export async function getCalendarMonth(month: number, year: number, signal?: AbortSignal): Promise<CalendarDay[]> {
  return apiRequest(`/calendar/month?month=${month}&year=${year}`, { requiresAuth: true, signal })
}

export async function getCalendarWeek(date: string, signal?: AbortSignal): Promise<CalendarDay[]> {
  return apiRequest(`/calendar/week?date=${date}`, { requiresAuth: true, signal })
}

export async function getCalendarDay(date: string, signal?: AbortSignal): Promise<CalendarDayDetail> {
  return apiRequest(`/calendar/day?date=${date}`, { requiresAuth: true, signal })
}

// ── Tasks ──
export async function getTask(id: string, signal?: AbortSignal): Promise<TaskResponse> {
  return apiRequest(`/tasks/${id}`, { requiresAuth: true, signal })
}

export async function createTask(data: CreateTaskInput): Promise<TaskResponse> {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<TaskResponse> {
  return apiRequest(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function deleteTask(id: string): Promise<void> {
  return apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export async function listTasks(): Promise<TaskResponse[]> {
  return apiRequest('/tasks', { requiresAuth: true })
}

export async function listTodayTasks(signal?: AbortSignal): Promise<TaskResponse[]> {
  return apiRequest('/tasks/today', { requiresAuth: true, signal })
}

export async function listInboxTasks(signal?: AbortSignal): Promise<TaskResponse[]> {
  return apiRequest('/tasks/inbox', { requiresAuth: true, signal })
}

// ── Lists ──
export async function createList(name: string, color?: string): Promise<List> {
  return apiRequest('/lists', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
    requiresAuth: true,
  })
}

export async function updateList(id: string, data: { name?: string; color?: string }): Promise<List> {
  return apiRequest(`/lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function deleteList(id: string): Promise<void> {
  return apiRequest(`/lists/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export async function listLists(signal?: AbortSignal): Promise<List[]> {
  return apiRequest('/lists', { requiresAuth: true, signal })
}

export interface ListTasksResponse {
  items: TaskResponse[]
  meta: { page: number; size: number; totalCount: number }
}

export async function listListTasks(listId: string, page?: number, size?: number, signal?: AbortSignal): Promise<ListTasksResponse> {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (size) params.set('size', String(size))
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/lists/${listId}/tasks${query}`, { requiresAuth: true, signal })
}

// ── Pomodoro ──
export async function startPomodoro(data: StartPomodoroInput = {}): Promise<PomodoroSession> {
  return apiRequest('/pomodoro', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function completePomodoro(id: string): Promise<PomodoroSession> {
  return apiRequest(`/pomodoro/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({}),
    requiresAuth: true,
  })
}

export async function cancelPomodoro(id: string): Promise<PomodoroSession> {
  return apiRequest(`/pomodoro/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({}),
    requiresAuth: true,
  })
}

export interface ListPomodorosResponse {
  pomodoroSessions: PomodoroSession[]
}

export async function listPomodoros(signal?: AbortSignal): Promise<ListPomodorosResponse> {
  return apiRequest('/pomodoro', { requiresAuth: true, signal })
}

export interface ActivePomodoroResponse {
  pomodoroSession?: PomodoroSession
}

export async function getActivePomodoro(signal?: AbortSignal): Promise<ActivePomodoroResponse> {
  return apiRequest('/pomodoro/active', { requiresAuth: true, signal })
}
