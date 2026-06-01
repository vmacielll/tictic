import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useListTasks } from './useListTasks'

// ── Mock @/lib/api ──
vi.mock('@/lib/api', () => ({
  listListTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

import {
  listListTasks,
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
// Matches the TaskResponse shape so it passes through parseTask() → taskSchema.
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

const mockListTasksResponse = {
  items: [mockTaskResponse],
  meta: { page: 1, size: 20, totalCount: 1 },
}

const listId = 'b2c3d4e5-f6a7-4901-8cde-f12345678901'

describe('useListTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. Initial fetch ──
  it('loads tasks for the given listId on mount', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    // Starts in loading state with empty tasks
    expect(result.current.loading).toBe(true)
    expect(result.current.tasks).toEqual([])
    expect(result.current.page).toBe(1)

    // Wait for the effect to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listListTasks).toHaveBeenCalledWith(listId, 1, 20, expect.any(AbortSignal))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].id).toBe(mockTaskResponse.id)
    expect(result.current.tasks[0].title).toBe(mockTaskResponse.title)
    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.totalCount).toBe(1)
    expect(result.current.error).toBeNull()
  })

  // ── 2. Pagination ──
  it('setPage — triggers refetch with new page number', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Initial fetch used page 1
    expect(listListTasks).toHaveBeenCalledWith(listId, 1, 20, expect.any(AbortSignal))

    // Prepare fresh data for page 2
    const page2TaskResponse = {
      ...mockTaskResponse,
      id: '99999999-8888-4777-8666-555555555555',
      title: 'Page 2 task',
    }
    const page2Response = {
      items: [page2TaskResponse],
      meta: { page: 2, size: 20, totalCount: 21 },
    }
    vi.mocked(listListTasks).mockResolvedValue(page2Response)

    await act(async () => {
      result.current.setPage(2)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Fetch was called with page 2
    expect(listListTasks).toHaveBeenCalledWith(listId, 2, 20, expect.any(AbortSignal))
    // Page state was updated
    expect(result.current.page).toBe(2)
    // Tasks reflect the new page data
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Page 2 task')
    // Pagination metadata updated
    expect(result.current.totalCount).toBe(21)
    expect(result.current.error).toBeNull()
  })

  // ── 3. addTask success ──
  it('addTask — creates task with listId included and prepends to state', async () => {
    vi.mocked(listListTasks).mockResolvedValue({
      items: [],
      meta: { page: 1, size: 20, totalCount: 0 },
    })

    const newTaskResponse = {
      ...mockTaskResponse,
      id: '11111111-2222-4333-8444-555555555555',
      title: 'New task',
    }
    vi.mocked(createTask).mockResolvedValue(newTaskResponse)

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.tasks).toEqual([])
    })

    await act(async () => {
      await result.current.addTask({ title: 'New task', priority: 'HIGH' })
    })

    // API was called with the validated input including listId
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New task', priority: 'HIGH', listId })
    )
    // Task was prepended (waitFor ensures React Query cache propagates)
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    expect(result.current.tasks[0].id).toBe(newTaskResponse.id)
    expect(result.current.tasks[0].title).toBe('New task')
    // Total count was incremented
    expect(result.current.totalCount).toBe(1)
    expect(result.current.error).toBeNull()
  })

  // ── 4. addTask error ──
  it('addTask — sets error when API fails', async () => {
    vi.mocked(listListTasks).mockResolvedValue({
      items: [],
      meta: { page: 1, size: 20, totalCount: 0 },
    })
    vi.mocked(createTask).mockRejectedValue(new Error('Create failed'))

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.addTask({ title: 'Fail task' })).rejects.toThrow('Create failed')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Create failed')
    })
    expect(result.current.tasks).toHaveLength(0)
  })

  // ── 5. toggleTask success ──
  it('toggleTask — optimistically toggles completed and calls API', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)
    vi.mocked(updateTask).mockResolvedValue({ ...mockTaskResponse, completed: true })

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

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

  // ── 6. toggleTask error ──
  it('toggleTask — reverts optimistic update when API fails', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)
    vi.mocked(updateTask).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

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

  // ── 7. removeTask success ──
  it('removeTask — optimistically removes task and calls API', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)
    vi.mocked(deleteTask).mockResolvedValue(undefined)

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.totalCount).toBe(1)

    await act(async () => {
      await result.current.removeTask(mockTaskResponse.id)
    })

    // Task was removed optimistically
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(0)
    })
    // Total count was decremented
    expect(result.current.totalCount).toBe(0)
    // API was called to delete
    expect(deleteTask).toHaveBeenCalledWith(mockTaskResponse.id)
    expect(result.current.error).toBeNull()
  })

  // ── 8. removeTask error ──
  it('removeTask — reverts optimistic update when API fails', async () => {
    vi.mocked(listListTasks).mockResolvedValue(mockListTasksResponse)
    vi.mocked(deleteTask).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useListTasks(listId), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tasks).toHaveLength(1)

    await act(async () => {
      await expect(result.current.removeTask(mockTaskResponse.id)).rejects.toThrow('Delete failed')
    })

    // Task was removed optimistically but restored by onError rollback
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1)
    })
    await waitFor(() => {
      expect(result.current.error).toBe('Delete failed')
    })
  })
})
