import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTasks } from './useTasks'

// ── Mock @/lib/api ──
vi.mock('@/lib/api', () => ({
  listInboxTasks: vi.fn(),
  listTodayTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

import {
  listInboxTasks,
  listTodayTasks,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/api'

// ── Test QueryClient ──
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

// ── Mock data ──
const mockTaskResponse = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  title: 'Test task',
  description: 'A test task description',
  priority: 'MEDIUM' as const,
  dueDate: '2026-04-10',
  dueTime: '14:00',
  dueTimezone: 'America/Sao_Paulo',
  completed: false,
  completedAt: undefined,
  listId: 'b2c3d4e5-f6a7-4901-8cde-f12345678901',
  userId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-10T08:00:00.000Z',
}

const mockTasksResponse = [mockTaskResponse]

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. Initial fetch ──
  it('loads inbox tasks on mount and sets loading to false', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)

    const { result } = renderHook(() => useTasks(), { wrapper })

    // Starts in loading state with empty tasks
    expect(result.current.loading).toBe(true)
    expect(result.current.tasks).toEqual([])

    // Wait for the query to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listInboxTasks).toHaveBeenCalledTimes(1)
    expect(listTodayTasks).not.toHaveBeenCalled()
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].id).toBe(mockTaskResponse.id)
    expect(result.current.tasks[0].title).toBe(mockTaskResponse.title)
    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // ── 2. Source switching ──
  it('fetches today tasks when source is "today"', async () => {
    vi.mocked(listTodayTasks).mockResolvedValue(mockTasksResponse)

    const { result } = renderHook(() => useTasks('today'), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listTodayTasks).toHaveBeenCalledTimes(1)
    expect(listInboxTasks).not.toHaveBeenCalled()
    expect(result.current.tasks).toHaveLength(1)
  })

  // ── 3. addTask ──
  it('validates input, calls createTask API, and prepends result', async () => {
    // Start with no tasks
    vi.mocked(listInboxTasks).mockResolvedValue([])

    const newTaskResponse = {
      ...mockTaskResponse,
      id: '11111111-2222-4333-8444-555555555555',
      title: 'New task title',
    }
    vi.mocked(createTask).mockResolvedValue(newTaskResponse)

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.tasks).toEqual([])
    })

    await act(async () => {
      await result.current.addTask({ title: 'New task title', priority: 'HIGH' })
    })

    // API was called with the validated input
    expect(createTask).toHaveBeenCalledWith({ title: 'New task title', priority: 'HIGH' })
    // Task was prepended (waitFor ensures React Query cache propagates to render)
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    expect(result.current.tasks[0].id).toBe('11111111-2222-4333-8444-555555555555')
    expect(result.current.tasks[0].title).toBe('New task title')
    expect(result.current.error).toBeNull()
  })

  // ── 4. addTask error ──
  it('sets error message when addTask API fails', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue([])
    vi.mocked(createTask).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.addTask({ title: 'Fail task' })).rejects.toThrow('Network error')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  // ── 5. updateTask ──
  it('validates input, calls updateTask API, and replaces task in list', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)

    const updatedResponse = {
      ...mockTaskResponse,
      title: 'Updated title',
      description: 'Updated description',
    }
    vi.mocked(updateTask).mockResolvedValue(updatedResponse)

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let returnedTask!: { title: string }
    await act(async () => {
      returnedTask = await result.current.updateTask(mockTaskResponse.id, { title: 'Updated title' })
    })

    expect(updateTask).toHaveBeenCalledWith(mockTaskResponse.id, { title: 'Updated title' })
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    expect(result.current.tasks[0].title).toBe('Updated title')
    expect(returnedTask.title).toBe('Updated title')
    expect(result.current.error).toBeNull()
  })

  // ── 6. toggleTask ──
  it('optimistically toggles completed and calls updateTask API', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)
    vi.mocked(updateTask).mockResolvedValue({ ...mockTaskResponse, completed: true })

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.tasks[0].completed).toBe(false)
    })

    await act(async () => {
      await result.current.toggleTask(mockTaskResponse.id, false)
    })

    // Optimistic update flipped completed
    await waitFor(() => {
      expect(result.current.tasks[0].completed).toBe(true)
    })
    // API was called with new completed state
    expect(updateTask).toHaveBeenCalledWith(mockTaskResponse.id, { completed: true })
    expect(result.current.error).toBeNull()
  })

  // ── 7. toggleTask error ──
  it('reverts optimistic update when toggleTask API fails', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)
    vi.mocked(updateTask).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.tasks[0].completed).toBe(false)
    })

    await act(async () => {
      await expect(result.current.toggleTask(mockTaskResponse.id, false)).rejects.toThrow('Update failed')
    })

    // Reverted back to original completed state
    await waitFor(() => {
      expect(result.current.tasks[0].completed).toBe(false)
    })
    await waitFor(() => {
      expect(result.current.error).toBe('Update failed')
    })
  })

  // ── 8. removeTask ──
  it('optimistically removes task and calls deleteTask API', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)
    vi.mocked(deleteTask).mockResolvedValue(undefined)

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(1)

    await act(async () => {
      await result.current.removeTask(mockTaskResponse.id)
    })

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(0)
    })
    expect(deleteTask).toHaveBeenCalledWith(mockTaskResponse.id)
    expect(result.current.error).toBeNull()
  })

  // ── 9. removeTask error ──
  it('sets error when deleteTask API fails (task stays removed)', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)
    vi.mocked(deleteTask).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(1)

    await act(async () => {
      await expect(result.current.removeTask(mockTaskResponse.id)).rejects.toThrow('Delete failed')
    })

    // Task was already removed optimistically but restored by onError rollback
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    await waitFor(() => {
      expect(result.current.error).toBe('Delete failed')
    })
  })

  // ── 10. refresh ──
  it('refetch refreshes the task list', async () => {
    vi.mocked(listInboxTasks).mockResolvedValue(mockTasksResponse)

    const { result } = renderHook(() => useTasks(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listInboxTasks).toHaveBeenCalledTimes(1)

    // Prepare fresh data for the refresh call
    const refreshedTask = { ...mockTaskResponse, title: 'Refreshed task' }
    vi.mocked(listInboxTasks).mockResolvedValue([refreshedTask])

    await act(async () => {
      await result.current.refresh()
    })

    // Fetch was called again
    expect(listInboxTasks).toHaveBeenCalledTimes(2)
    // Loading stays false during refetch (isFetching becomes true instead)
    expect(result.current.loading).toBe(false)
    // List is replaced with fresh data
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    expect(result.current.tasks[0].title).toBe('Refreshed task')
    expect(result.current.error).toBeNull()
  })
})
