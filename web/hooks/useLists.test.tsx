import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useLists } from './useLists'

// ── Mock @/lib/api ──
vi.mock('@/lib/api', () => ({
  listLists: vi.fn(),
  createList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
}))

import {
  listLists,
  createList,
  updateList,
  deleteList,
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
const mockListResponse = {
  id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  name: 'Work',
  color: '#4f46e5',
  userId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
  taskCount: 0,
  createdAt: '2026-04-09T10:00:00.000Z',
}

const mockListsResponse = [mockListResponse]

describe('useLists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. Initial fetch ──
  it('loads lists on mount and sets loading to false', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)

    const { result } = renderHook(() => useLists(), { wrapper })

    // Starts in loading state with empty lists
    expect(result.current.loading).toBe(true)
    expect(result.current.lists).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listLists).toHaveBeenCalledTimes(1)
    expect(result.current.lists).toHaveLength(1)
    expect(result.current.lists[0].id).toBe(mockListResponse.id)
    expect(result.current.lists[0].name).toBe(mockListResponse.name)
    expect(result.current.lists[0].color).toBe(mockListResponse.color)
    expect(result.current.error).toBeNull()
  })

  // ── 2. addList ──
  it('addList — creates list and prepends to state', async () => {
    vi.mocked(listLists).mockResolvedValue([])

    const newListResponse = {
      ...mockListResponse,
      id: '22222222-3333-4444-8555-666666666666',
      name: 'Personal',
    }
    vi.mocked(createList).mockResolvedValue(newListResponse)

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.lists).toEqual([])
    })

    await act(async () => {
      await result.current.addList('Personal', '#0891b2')
    })

    // API was called with the correct args
    expect(createList).toHaveBeenCalledWith('Personal', '#0891b2')

    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1)
    })
    expect(result.current.lists[0].id).toBe(newListResponse.id)
    expect(result.current.lists[0].name).toBe('Personal')
    expect(result.current.error).toBeNull()
  })

  // ── 3. addList error ──
  it('addList — sets error when API fails', async () => {
    vi.mocked(listLists).mockResolvedValue([])
    vi.mocked(createList).mockRejectedValue(new Error('Create failed'))

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.addList('Fail')).rejects.toThrow('Create failed')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Create failed')
    })
    expect(result.current.lists).toHaveLength(0)
  })

  // ── 4. renameList ──
  it('renameList — optimistically updates name and calls API', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)
    vi.mocked(updateList).mockResolvedValue({ ...mockListResponse, name: 'Updated' })

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.lists[0].name).toBe('Work')
    })

    await act(async () => {
      await result.current.renameList(mockListResponse.id, 'Updated')
    })

    // Optimistic update changed the name immediately
    await waitFor(() => {
      expect(result.current.lists[0].name).toBe('Updated')
    })
    // API was called with the new name
    expect(updateList).toHaveBeenCalledWith(mockListResponse.id, { name: 'Updated' })
    expect(result.current.error).toBeNull()
  })

  // ── 5. renameList error ──
  it('renameList — reverts optimistic update on API failure', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)
    vi.mocked(updateList).mockRejectedValue(new Error('Rename failed'))

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.lists[0].name).toBe('Work')
    })

    await act(async () => {
      await expect(result.current.renameList(mockListResponse.id, 'Updated')).rejects.toThrow('Rename failed')
    })

    // Reverted back to original name
    await waitFor(() => {
      expect(result.current.lists[0].name).toBe('Work')
    })
    await waitFor(() => {
      expect(result.current.error).toBe('Rename failed')
    })
  })

  // ── 6. changeColor ──
  it('changeColor — optimistically updates color', async () => {
    vi.mocked(listLists).mockResolvedValue([{ ...mockListResponse, color: '#4f46e5' }])
    vi.mocked(updateList).mockResolvedValue({ ...mockListResponse, color: '#0891b2' })

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.lists[0].color).toBe('#4f46e5')
    })

    await act(async () => {
      await result.current.changeColor(mockListResponse.id, '#0891b2')
    })

    // Optimistic update changed the color immediately
    await waitFor(() => {
      expect(result.current.lists[0].color).toBe('#0891b2')
    })
    // API was called with the new color
    expect(updateList).toHaveBeenCalledWith(mockListResponse.id, { color: '#0891b2' })
    expect(result.current.error).toBeNull()
  })

  // ── 7. changeColor error ──
  it('changeColor — reverts optimistic update on API failure', async () => {
    vi.mocked(listLists).mockResolvedValue([{ ...mockListResponse, color: '#4f46e5' }])
    vi.mocked(updateList).mockRejectedValue(new Error('Color update failed'))

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.lists[0].color).toBe('#4f46e5')
    })

    await act(async () => {
      await expect(result.current.changeColor(mockListResponse.id, '#0891b2')).rejects.toThrow('Color update failed')
    })

    // Reverted back to original color
    await waitFor(() => {
      expect(result.current.lists[0].color).toBe('#4f46e5')
    })
    await waitFor(() => {
      expect(result.current.error).toBe('Color update failed')
    })
  })

  // ── 8. removeList ──
  it('removeList — optimistically removes and calls API', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)
    vi.mocked(deleteList).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.lists).toHaveLength(1)

    await act(async () => {
      await result.current.removeList(mockListResponse.id)
    })

    // List was removed optimistically
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(0)
    })
    // API was called to delete
    expect(deleteList).toHaveBeenCalledWith(mockListResponse.id)
    expect(result.current.error).toBeNull()
  })

  // ── 9. removeList error ──
  it('removeList — reverts on API failure (re-adds list)', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)
    vi.mocked(deleteList).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.lists).toHaveLength(1)

    await act(async () => {
      await expect(result.current.removeList(mockListResponse.id)).rejects.toThrow('Delete failed')
    })

    // List was re-added on error
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1)
    })
    expect(result.current.lists[0].id).toBe(mockListResponse.id)
    await waitFor(() => {
      expect(result.current.error).toBe('Delete failed')
    })
  })

  // ── 10. refresh ──
  it('refresh — refetches lists', async () => {
    vi.mocked(listLists).mockResolvedValue(mockListsResponse)

    const { result } = renderHook(() => useLists(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listLists).toHaveBeenCalledTimes(1)

    // Prepare fresh data for the refresh call
    const refreshedList = { ...mockListResponse, name: 'Refreshed' }
    vi.mocked(listLists).mockResolvedValue([refreshedList])

    await act(async () => {
      await result.current.refresh()
    })

    // Fetch was called again
    expect(listLists).toHaveBeenCalledTimes(2)
    // Loading stays false during refetch
    expect(result.current.loading).toBe(false)
    // List is replaced with fresh data
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(1)
    })
    expect(result.current.lists[0].name).toBe('Refreshed')
    expect(result.current.error).toBeNull()
  })
})
