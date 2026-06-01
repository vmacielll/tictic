'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  const queryKey = ['lists']

  const {
    data: lists = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const result = await listLists(signal)
      return parseLists(result)
    },
  })

  // ── Add list ──
  const addListMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const raw = await createList(name, color)
      return parseList(raw)
    },
    onSuccess: (created) => {
      queryClient.setQueryData<List[]>(queryKey, (prev = []) => [created, ...prev])
    },
  })

  // ── Rename list (optimistic) ──
  const renameListMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await updateList(id, { name })
    },
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<List[]>(queryKey)

      queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
        prev.map((l) => (l.id === id ? { ...l, name } : l))
      )

      return { previous }
    },
    onError: (_err, { id }, context) => {
      if (!context?.previous) return
      const snapshot = context.previous.find((l: List) => l.id === id)
      if (snapshot) {
        queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
          prev.map((l) => (l.id === id ? snapshot : l))
        )
      }
    },
  })

  // ── Change color (optimistic) ──
  const changeColorMutation = useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      await updateList(id, { color })
    },
    onMutate: async ({ id, color }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<List[]>(queryKey)

      queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
        prev.map((l) => (l.id === id ? { ...l, color } : l))
      )

      return { previous }
    },
    onError: (_err, { id }, context) => {
      if (!context?.previous) return
      const snapshot = context.previous.find((l: List) => l.id === id)
      if (snapshot) {
        queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
          prev.map((l) => (l.id === id ? snapshot : l))
        )
      }
    },
  })

  // ── Remove list (optimistic) ──
  const removeListMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteList(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<List[]>(queryKey)

      queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
        prev.filter((l) => l.id !== id)
      )

      return { previous }
    },
    onError: (_err, id, context) => {
      if (!context?.previous) return
      const snapshot = context.previous.find((l: List) => l.id === id)
      if (snapshot) {
        queryClient.setQueryData<List[]>(queryKey, (prev = []) =>
          prev.some((l) => l.id === id) ? prev : [snapshot, ...prev]
        )
      }
    },
  })

  // Combine query errors and the most recent mutation error
  const error =
    addListMutation.error instanceof Error ? addListMutation.error.message :
    renameListMutation.error instanceof Error ? renameListMutation.error.message :
    changeColorMutation.error instanceof Error ? changeColorMutation.error.message :
    removeListMutation.error instanceof Error ? removeListMutation.error.message :
    queryError instanceof Error ? queryError.message : null

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    lists,
    loading: isLoading,
    error,
    addList: (name: string, color?: string) =>
      addListMutation.mutateAsync({ name, color }),
    renameList: (id: string, name: string) =>
      renameListMutation.mutateAsync({ id, name }),
    changeColor: (id: string, color: string) =>
      changeColorMutation.mutateAsync({ id, color }),
    removeList: (id: string) =>
      removeListMutation.mutateAsync(id),
    refresh: () => refresh(),
  }
}
