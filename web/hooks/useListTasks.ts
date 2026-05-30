'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'
import {
  listListTasks,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/api'
import {
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
  parseTasks,
  parseTask,
  createTaskSchema,
  updateTaskSchema,
} from '@/domain/tasks/types'

interface ListTasksMeta {
  page: number
  size: number
  totalCount: number
}

interface ListTasksResponse {
  items: unknown[]
  meta: ListTasksMeta
}

interface UseListTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalCount: number
  addTask: (data: CreateTaskInput) => Promise<void>
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>
  toggleTask: (id: string, completed: boolean) => Promise<void>
  removeTask: (id: string) => Promise<void>
  setPage: (page: number) => void
  refresh: () => Promise<void>
}

export function useListTasks(listId: string): UseListTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const raw = await listListTasks(listId, page, 20, signal) as ListTasksResponse
      if (!raw) return // Request was aborted
      setTasks(parseTasks(raw.items))
      setTotalPages(Math.ceil(raw.meta.totalCount / raw.meta.size) || 1)
      setTotalCount(raw.meta.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [listId, page])

  useEffect(() => {
    const controller = new AbortController()
    fetchTasks(controller.signal)
    return () => controller.abort()
  }, [fetchTasks])

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  const addTask = useCallback(async (data: CreateTaskInput) => {
    try {
      const validated = createTaskSchema.parse({ ...data, listId })
      const raw = await createTask(validated)
      const created = parseTask(raw)
      setTasks((prev) => [created, ...prev])
      setTotalCount((prev) => prev + 1)
      setTotalPages((prev) => Math.ceil((totalCount + 1) / 20) || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }, [listId, totalCount])

  const updateTaskFn = useCallback(async (id: string, data: UpdateTaskInput) => {
    try {
      const validated = updateTaskSchema.parse(data)
      const raw = await updateTask(id, validated)
      const updated = parseTask(raw)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const toggleTask = useCallback(async (id: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: newCompleted, completedAt: newCompleted ? DateTime.now().toJSDate() : undefined }
          : t
      )
    )

    try {
      await updateTask(id, { completed: newCompleted })
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, completed: currentCompleted, completedAt: t.completedAt }
            : t
        )
      )
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const removeTask = useCallback(async (id: string) => {
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setTotalCount((prev) => prev - 1)
    setTotalPages((prev) => Math.ceil((totalCount - 1) / 20) || 1)

    try {
      await deleteTask(id)
    } catch (err) {
      // Revert on error
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [totalCount])

  return {
    tasks,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    addTask,
    updateTask: updateTaskFn,
    toggleTask,
    removeTask,
    setPage,
    refresh: fetchTasks,
  }
}
