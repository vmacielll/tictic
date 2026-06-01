'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import {
  listInboxTasks,
  listTodayTasks,
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

type TaskSource = 'inbox' | 'today'

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask: (data: CreateTaskInput) => Promise<void>
  updateTask: (id: string, data: UpdateTaskInput) => Promise<Task>
  toggleTask: (id: string, currentCompleted: boolean) => Promise<void>
  removeTask: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useTasks(source: TaskSource = 'inbox'): UseTasksReturn {
  const queryClient = useQueryClient()
  const queryKey = ['tasks', source]

  const {
    data: tasks = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const result = source === 'inbox' ? await listInboxTasks(signal) : await listTodayTasks(signal)
      return parseTasks(result)
    },
  })

  // ── Create task ──
  const addTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const validated = createTaskSchema.parse(data)
      const raw = await createTask(validated)
      return parseTask(raw)
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Task[]>(queryKey, (prev = []) => [created, ...prev])
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
      queryClient.setQueryData<Task[]>(queryKey, (prev = []) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      )
    },
  })

  // ── Toggle task (optimistic) ──
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await updateTask(id, { completed })
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Task[]>(queryKey)

      queryClient.setQueryData<Task[]>(queryKey, (prev = []) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed,
                completedAt: completed ? DateTime.now().toJSDate() : undefined,
              }
            : t
        )
      )

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
      const previous = queryClient.getQueryData<Task[]>(queryKey)

      queryClient.setQueryData<Task[]>(queryKey, (prev = []) =>
        prev.filter((t) => t.id !== id)
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  // Combine query errors and the most recent mutation error
  const error =
    addTaskMutation.error instanceof Error ? addTaskMutation.error.message :
    updateTaskMutation.error instanceof Error ? updateTaskMutation.error.message :
    toggleTaskMutation.error instanceof Error ? toggleTaskMutation.error.message :
    removeTaskMutation.error instanceof Error ? removeTaskMutation.error.message :
    queryError instanceof Error ? queryError.message : null

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    tasks,
    loading: isLoading,
    error,
    addTask: (data: CreateTaskInput): Promise<void> =>
      addTaskMutation.mutateAsync(data).then(() => {}),
    updateTask: (id: string, data: UpdateTaskInput) =>
      updateTaskMutation.mutateAsync({ id, data }),
    toggleTask: (id: string, currentCompleted: boolean): Promise<void> =>
      toggleTaskMutation.mutateAsync({ id, completed: !currentCompleted }).then(() => {}),
    removeTask: (id: string): Promise<void> =>
      removeTaskMutation.mutateAsync(id).then(() => {}),
    refresh: () => refresh(),
  }
}
