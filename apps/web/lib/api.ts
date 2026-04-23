const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
  _retry?: boolean
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && !_retry && requiresAuth) {
    try {
      await refreshToken()
      return apiRequest<T>(endpoint, { ...restOptions, requiresAuth, headers, _retry: true })
    } catch {
      throw new Error('Session expired')
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

async function refreshToken(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function getMe(): Promise<{ id: string; name: string; email: string }> {
  return apiRequest('/auth/me', { requiresAuth: true })
}

// ── Auth ──
export async function login(email: string, password: string): Promise<unknown> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(name: string, email: string, password: string): Promise<unknown> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

// ── Calendar ──
export async function getCalendarMonth(month: number, year: number): Promise<unknown> {
  return apiRequest(`/calendar/month?month=${month}&year=${year}`, { requiresAuth: true })
}

export async function getCalendarWeek(date: string): Promise<unknown> {
  return apiRequest(`/calendar/week?date=${date}`, { requiresAuth: true })
}

export async function getCalendarDay(date: string): Promise<unknown> {
  return apiRequest(`/calendar/day?date=${date}`, { requiresAuth: true })
}

// ── Tasks ──
export async function createTask(data: unknown): Promise<unknown> {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function updateTask(id: string, data: unknown): Promise<unknown> {
  return apiRequest(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function completeTask(id: string): Promise<unknown> {
  return apiRequest(`/tasks/${id}/complete`, {
    method: 'PATCH',
    requiresAuth: true,
  })
}

export async function uncompleteTask(id: string): Promise<unknown> {
  return apiRequest(`/tasks/${id}/uncomplete`, {
    method: 'PATCH',
    requiresAuth: true,
  })
}

export async function deleteTask(id: string): Promise<void> {
  return apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export async function listTasks(): Promise<unknown[]> {
  return apiRequest('/tasks', { requiresAuth: true })
}

export async function listTodayTasks(): Promise<unknown[]> {
  return apiRequest('/tasks/today', { requiresAuth: true })
}

export async function listInboxTasks(): Promise<unknown[]> {
  return apiRequest('/tasks/inbox', { requiresAuth: true })
}

// ── Lists ──
export async function createList(name: string, color?: string): Promise<unknown> {
  return apiRequest('/lists', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
    requiresAuth: true,
  })
}

export async function updateList(id: string, data: { name?: string; color?: string }): Promise<unknown> {
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

export async function listLists(): Promise<unknown[]> {
  return apiRequest('/lists', { requiresAuth: true })
}

// ── Pomodoro ──
export async function startPomodoro(data: unknown = {}): Promise<unknown> {
  return apiRequest('/pomodoro', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
  })
}

export async function completePomodoro(id: string): Promise<unknown> {
  return apiRequest(`/pomodoro/${id}/complete`, {
    method: 'PATCH',
    requiresAuth: true,
  })
}

export async function cancelPomodoro(id: string): Promise<unknown> {
  return apiRequest(`/pomodoro/${id}/cancel`, {
    method: 'PATCH',
    requiresAuth: true,
  })
}

export async function listPomodoros(): Promise<unknown> {
  return apiRequest('/pomodoro', { requiresAuth: true })
}

export async function getActivePomodoro(): Promise<unknown> {
  return apiRequest('/pomodoro/active', { requiresAuth: true })
}
