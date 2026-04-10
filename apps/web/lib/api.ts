const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Auth types
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = false, headers: customHeaders, ...restOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': typeof window !== 'undefined' 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : 'UTC',
    ...(customHeaders as Record<string, string>),
  }

  if (requiresAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

// Calendar API helpers
export interface CalendarTask {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  completed: boolean
  dueDate: string
  dueTime?: string
  listId?: string
}

export interface CalendarDay {
  date: string
  tasks: CalendarTask[]
}

export async function getCalendarMonth(month: number, year: number): Promise<{ days: CalendarDay[] }> {
  return apiRequest(`/calendar/month?month=${month}&year=${year}`, { requiresAuth: true })
}

export async function getCalendarWeek(date: string): Promise<{ days: CalendarDay[] }> {
  return apiRequest(`/calendar/week?date=${date}`, { requiresAuth: true })
}

export async function getCalendarDay(date: string): Promise<{ date: string; tasks: CalendarTask[] }> {
  return apiRequest(`/calendar/day?date=${date}`, { requiresAuth: true })
}

// Task types
export interface Task {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  dueTime?: string
  completed: boolean
  completedAt?: string
  listId?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  dueTime?: string
  listId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  dueTime?: string
  listId?: string
}

// Task API helpers
export async function createTask(data: CreateTaskInput): Promise<Task> {
  return apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data), requiresAuth: true })
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
  return apiRequest(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data), requiresAuth: true })
}

export async function completeTask(id: string): Promise<{ id: string; completed: boolean; completedAt?: string }> {
  return apiRequest(`/tasks/${id}/complete`, { method: 'PATCH', requiresAuth: true })
}

export async function uncompleteTask(id: string): Promise<{ id: string; completed: boolean }> {
  return apiRequest(`/tasks/${id}/uncomplete`, { method: 'PATCH', requiresAuth: true })
}

export async function deleteTask(id: string): Promise<void> {
  return apiRequest(`/tasks/${id}`, { method: 'DELETE', requiresAuth: true })
}

export async function listTasks(): Promise<Task[]> {
  return apiRequest('/tasks', { requiresAuth: true })
}

export async function listTodayTasks(): Promise<Task[]> {
  return apiRequest('/tasks/today', { requiresAuth: true })
}

export async function listInboxTasks(): Promise<Task[]> {
  return apiRequest('/tasks/inbox', { requiresAuth: true })
}

// List types
export interface List {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: string
}

// List API helpers
export async function createList(name: string, color?: string): Promise<List> {
  return apiRequest('/lists', { method: 'POST', body: JSON.stringify({ name, color }), requiresAuth: true })
}

export async function updateList(id: string, data: { name?: string; color?: string }): Promise<List> {
  return apiRequest(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify(data), requiresAuth: true })
}

export async function deleteList(id: string): Promise<void> {
  return apiRequest(`/lists/${id}`, { method: 'DELETE', requiresAuth: true })
}

export async function listLists(): Promise<List[]> {
  return apiRequest('/lists', { requiresAuth: true })
}

// Pomodoro types
export interface PomodoroSession {
  id: string
  userId: string
  taskId?: string
  duration: number
  startedAt: string
  completedAt?: string
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED'
}

export interface StartPomodoroInput {
  duration?: number
  taskId?: string
}

// Pomodoro API helpers
export async function startPomodoro(data: StartPomodoroInput = {}): Promise<PomodoroSession> {
  return apiRequest('/pomodoro', { method: 'POST', body: JSON.stringify(data), requiresAuth: true })
}

export async function completePomodoro(id: string): Promise<PomodoroSession> {
  return apiRequest(`/pomodoro/${id}/complete`, { method: 'PATCH', requiresAuth: true })
}

export async function cancelPomodoro(id: string): Promise<PomodoroSession> {
  return apiRequest(`/pomodoro/${id}/cancel`, { method: 'PATCH', requiresAuth: true })
}

export async function listPomodoros(): Promise<{ pomodoroSessions: PomodoroSession[] }> {
  return apiRequest('/pomodoro', { requiresAuth: true })
}

export async function getActivePomodoro(): Promise<{ pomodoroSession?: PomodoroSession }> {
  return apiRequest('/pomodoro/active', { requiresAuth: true })
}
