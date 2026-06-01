import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { getTask } from '@/lib/api'
import { parseTask, type Task } from '@/domain/tasks/types'

vi.mock('@/lib/api', () => ({
  getTask: vi.fn(),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false },
    },
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

// ── Test Data ──

const mockTaskResponse = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  title: 'Test task',
  description: 'A test task description',
  priority: 'MEDIUM',
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

const parsedTask: Task = parseTask(mockTaskResponse)

// ── Helpers ──

function setup() {
  const onUpdateTask = vi.fn()
  const onDeleteTask = vi.fn()
  const onToggleTask = vi.fn()
  const { result } = renderHook(
    () => useTaskDetail(onUpdateTask, onDeleteTask, onToggleTask),
    { wrapper }
  )
  return { result, onUpdateTask, onDeleteTask, onToggleTask }
}

const mockedGetTask = vi.mocked(getTask)

// ── Tests ──

describe('useTaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('returns selectedTask as null and isModalOpen as false', () => {
      const { result } = setup()

      expect(result.current.selectedTask).toBeNull()
      expect(result.current.isModalOpen).toBe(false)
    })
  })

  describe('openModal', () => {
    it('fetches task and sets selectedTask and isModalOpen', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result } = setup()

      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })

      expect(mockedGetTask).toHaveBeenCalledWith(mockTaskResponse.id, expect.any(AbortSignal))
      expect(mockedGetTask).toHaveBeenCalledTimes(1)
      expect(result.current.selectedTask).toEqual(parsedTask)
      expect(result.current.isModalOpen).toBe(true)
    })

    it('handles API error gracefully without changing state', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const apiError = new Error('Network error')
      mockedGetTask.mockRejectedValue(apiError)
      const { result } = setup()

      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch task:', apiError)
      expect(result.current.selectedTask).toBeNull()
      expect(result.current.isModalOpen).toBe(false)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('closeModal', () => {
    it('sets isModalOpen to false and selectedTask to null', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result } = setup()

      // Open the modal first
      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })
      expect(result.current.isModalOpen).toBe(true)
      expect(result.current.selectedTask).toEqual(parsedTask)

      // Close the modal
      act(() => {
        result.current.closeModal()
      })

      expect(result.current.isModalOpen).toBe(false)
      expect(result.current.selectedTask).toBeNull()
    })
  })

  describe('handleSave', () => {
    it('calls onUpdateTask callback and updates selectedTask', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result, onUpdateTask } = setup()

      // Open the modal first so there is a selectedTask
      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })

      const updatedTask: Task = {
        ...parsedTask,
        title: 'Updated task',
        description: 'Updated description',
      }

      act(() => {
        result.current.handleSave(updatedTask)
      })

      expect(onUpdateTask).toHaveBeenCalledWith(updatedTask)
      expect(onUpdateTask).toHaveBeenCalledTimes(1)
      expect(result.current.selectedTask).toEqual(updatedTask)
    })
  })

  describe('handleDelete', () => {
    it('calls onDeleteTask callback and closes modal', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result, onDeleteTask } = setup()

      // Open the modal first
      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })
      expect(result.current.isModalOpen).toBe(true)

      act(() => {
        result.current.handleDelete(mockTaskResponse.id)
      })

      expect(onDeleteTask).toHaveBeenCalledWith(mockTaskResponse.id)
      expect(onDeleteTask).toHaveBeenCalledTimes(1)
      expect(result.current.isModalOpen).toBe(false)
      expect(result.current.selectedTask).toBeNull()
    })
  })

  describe('handleToggleComplete', () => {
    it('toggles completed to true and sets completedAt when wasCompleted is false', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result, onToggleTask } = setup()

      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })
      expect(result.current.selectedTask?.completed).toBe(false)
      expect(result.current.selectedTask?.completedAt).toBeUndefined()

      act(() => {
        result.current.handleToggleComplete(mockTaskResponse.id, false)
      })

      expect(onToggleTask).toHaveBeenCalledWith(mockTaskResponse.id, false)
      expect(onToggleTask).toHaveBeenCalledTimes(1)
      expect(result.current.selectedTask?.completed).toBe(true)
      expect(result.current.selectedTask?.completedAt).toBeInstanceOf(Date)
    })

    it('toggles completed to false and clears completedAt when wasCompleted is true', async () => {
      const completedResponse = {
        ...mockTaskResponse,
        completed: true,
        completedAt: '2026-04-10T08:00:00.000Z',
      }
      mockedGetTask.mockResolvedValue(completedResponse)
      const completedTask = parseTask(completedResponse)
      const { result, onToggleTask } = setup()

      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })
      expect(result.current.selectedTask?.completed).toBe(true)
      expect(result.current.selectedTask?.completedAt).toBeInstanceOf(Date)

      act(() => {
        result.current.handleToggleComplete(mockTaskResponse.id, true)
      })

      expect(onToggleTask).toHaveBeenCalledWith(mockTaskResponse.id, true)
      expect(result.current.selectedTask?.completed).toBe(false)
      expect(result.current.selectedTask?.completedAt).toBeUndefined()
    })

    it('calls onToggleTask without modifying selectedTask when no modal is open', () => {
      const { result, onToggleTask } = setup()

      act(() => {
        result.current.handleToggleComplete('some-task-id', false)
      })

      expect(onToggleTask).toHaveBeenCalledWith('some-task-id', false)
      expect(onToggleTask).toHaveBeenCalledTimes(1)
      expect(result.current.selectedTask).toBeNull()
    })

    it('calls onToggleTask without modifying selectedTask when taskId does not match selected task', async () => {
      mockedGetTask.mockResolvedValue(mockTaskResponse)
      const { result, onToggleTask } = setup()

      await act(async () => {
        await result.current.openModal(mockTaskResponse.id)
      })
      expect(result.current.selectedTask?.id).toBe(mockTaskResponse.id)

      act(() => {
        result.current.handleToggleComplete('different-task-id', false)
      })

      expect(onToggleTask).toHaveBeenCalledWith('different-task-id', false)
      // selectedTask's completed should remain unchanged
      expect(result.current.selectedTask?.completed).toBe(false)
      expect(result.current.selectedTask?.completedAt).toBeUndefined()
    })
  })
})
