'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  listLists,
  createList,
  updateList,
  deleteList,
} from '@/lib/api'
import {
  type List,
  parseLists,
  parseList,
} from '@/domain/lists/types'

interface UseListsReturn {
  lists: List[]
  loading: boolean
  error: string | null
  addList: (name: string, color?: string) => Promise<void>
  renameList: (id: string, name: string) => Promise<void>
  changeColor: (id: string, color: string) => Promise<void>
  removeList: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useLists(): UseListsReturn {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const result = await listLists(signal)
      if (!result) return // Request was aborted
      setLists(parseLists(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchLists(controller.signal)
    return () => controller.abort()
  }, [fetchLists])

  const addList = useCallback(async (name: string, color?: string) => {
    try {
      const raw = await createList(name, color)
      const created = parseList(raw)
      setLists((prev) => [created, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list')
      throw err
    }
  }, [])

  const renameList = useCallback(async (id: string, name: string) => {
    // Snapshot for rollback
    const snapshot = lists.find((l) => l.id === id)
    // Optimistic update
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)))

    try {
      await updateList(id, { name })
    } catch (err) {
      // Revert on error
      if (snapshot) {
        setLists((prev) => prev.map((l) => (l.id === id ? snapshot : l)))
      }
      setError(err instanceof Error ? err.message : 'Failed to rename list')
      throw err
    }
  }, [lists])

  const changeColor = useCallback(async (id: string, color: string) => {
    // Snapshot for rollback
    const snapshot = lists.find((l) => l.id === id)
    // Optimistic update
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l)))

    try {
      await updateList(id, { color })
    } catch (err) {
      // Revert on error
      if (snapshot) {
        setLists((prev) => prev.map((l) => (l.id === id ? snapshot : l)))
      }
      setError(err instanceof Error ? err.message : 'Failed to change list color')
      throw err
    }
  }, [lists])

  const removeList = useCallback(async (id: string) => {
    // Snapshot for rollback
    const snapshot = lists.find((l) => l.id === id)
    // Optimistic update
    setLists((prev) => prev.filter((l) => l.id !== id))

    try {
      await deleteList(id)
    } catch (err) {
      // Revert on error
      if (snapshot) {
        setLists((prev) => [snapshot, ...prev])
      }
      setError(err instanceof Error ? err.message : 'Failed to delete list')
      throw err
    }
  }, [lists])

  return {
    lists,
    loading,
    error,
    addList,
    renameList,
    changeColor,
    removeList,
    refresh: fetchLists,
  }
}
