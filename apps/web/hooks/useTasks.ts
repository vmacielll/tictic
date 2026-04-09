'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  listInboxTasks,
  listTodayTasks,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/lib/api'

type TaskSource = 'inbox' | 'today'

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask: (data: CreateTaskInput) => Promise<void>
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>
  toggleTask: (id: string, completed: boolean) => Promise<void>
  removeTask: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useTasks(source: TaskSource = 'inbox'): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = source === 'inbox' ? await listInboxTasks() : await listTodayTasks()
      setTasks(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [source])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = useCallback(async (data: CreateTaskInput) => {
    try {
      const created = await createTask(data)
      setTasks((prev) => [created, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }, [])

  const updateTaskFn = useCallback(async (id: string, data: UpdateTaskInput) => {
    try {
      const updated = await updateTask(id, data)
      setTasks((prev) => prev.map((t) => t.id === id ? updated : t))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const toggleTask = useCallback(async (id: string, currentCompleted: boolean) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !currentCompleted, completedAt: currentCompleted ? undefined : new Date().toISOString() }
          : t
      )
    )

    try {
      if (currentCompleted) {
        await uncompleteTask(id)
      } else {
        await completeTask(id)
      }
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

    try {
      await deleteTask(id)
    } catch (err) {
      // Revert on error
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [])

  return { tasks, loading, error, addTask, updateTask: updateTaskFn, toggleTask, removeTask, refresh: fetchTasks }
}
