'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

interface QueryData {
  items: Task[]
  meta: { page: number; size: number; totalCount: number }
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
  const queryClient = useQueryClient()
  const [page, setPageState] = useState(1)
  const queryKey = ['tasks', 'list', listId, { page }] as const

  const { data, isLoading, error: queryError } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const raw = await listListTasks(listId, page, 20, signal)
      return { items: parseTasks(raw.items), meta: raw.meta } as QueryData
    },
  })

  const tasks = data?.items ?? []
  const totalPages = Math.ceil((data?.meta.totalCount ?? 0) / 20) || 1
  const totalCount = data?.meta.totalCount ?? 0

  // ── Create task ──
  const addTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const validated = createTaskSchema.parse({ ...data, listId })
      const raw = await createTask(validated)
      return parseTask(raw)
    },
    onSuccess: (created) => {
      queryClient.setQueryData<QueryData>(queryKey, (prev) => {
        if (!prev) return prev
        return {
          items: [created, ...prev.items],
          meta: { ...prev.meta, totalCount: prev.meta.totalCount + 1 },
        }
      })
    },
  })

  // ── Update task ──
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const validated = updateTaskSchema.parse(data)
      const raw = await updateTask(id, validated)
      return parseTask(raw)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<QueryData>(queryKey, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((t) => (t.id === updated.id ? updated : t)),
        }
      })
    },
  })

  // ── Toggle task (optimistic) ──
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await updateTask(id, { completed })
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<QueryData>(queryKey)

      queryClient.setQueryData<QueryData>(queryKey, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((t) =>
            t.id === id
              ? { ...t, completed, completedAt: completed ? DateTime.now().toJSDate() : undefined }
              : t
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  // ── Remove task (optimistic) ──
  const removeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteTask(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<QueryData>(queryKey)

      queryClient.setQueryData<QueryData>(queryKey, (prev) => {
        if (!prev) return prev
        return {
          items: prev.items.filter((t) => t.id !== id),
          meta: { ...prev.meta, totalCount: prev.meta.totalCount - 1 },
        }
      })

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  // Combine errors
  const error =
    addTaskMutation.error instanceof Error ? addTaskMutation.error.message :
    updateTaskMutation.error instanceof Error ? updateTaskMutation.error.message :
    toggleTaskMutation.error instanceof Error ? toggleTaskMutation.error.message :
    removeTaskMutation.error instanceof Error ? removeTaskMutation.error.message :
    queryError instanceof Error ? queryError.message : null

  const setPage = (newPage: number) => {
    setPageState(newPage)
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    tasks,
    loading: isLoading,
    error,
    page,
    totalPages,
    totalCount,
    addTask: (data: CreateTaskInput): Promise<void> =>
      addTaskMutation.mutateAsync(data).then(() => {}),
    updateTask: (id: string, data: UpdateTaskInput) =>
      updateTaskMutation.mutateAsync({ id, data }),
    toggleTask: (id: string, currentCompleted: boolean): Promise<void> =>
      toggleTaskMutation.mutateAsync({ id, completed: !currentCompleted }).then(() => {}),
    removeTask: (id: string): Promise<void> =>
      removeTaskMutation.mutateAsync(id).then(() => {}),
    setPage,
    refresh,
  }
}
