'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useLists } from '@/hooks/useLists'
import type { List } from '@/domain/lists/types'

interface ListsContextValue {
  lists: List[]
  loading: boolean
  error: string | null
  addList: (name: string, color?: string) => Promise<void>
  renameList: (id: string, name: string) => Promise<void>
  changeColor: (id: string, color: string) => Promise<void>
  removeList: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const ListsContext = createContext<ListsContextValue | null>(null)

export function ListsProvider({ children }: { children: ReactNode }) {
  const listsData = useLists()
  return (
    <ListsContext.Provider value={listsData}>
      {children}
    </ListsContext.Provider>
  )
}

export function useListsContext() {
  const context = useContext(ListsContext)
  if (!context) {
    throw new Error('useListsContext must be used within a ListsProvider')
  }
  return context
}
