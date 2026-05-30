'use client'

import { useState } from 'react'
import { useListsContext } from '@/contexts/ListsContext'
import { ListForm } from '@/components/lists/ListForm'
import { ListItem } from '@/components/lists/ListItem'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { List } from '@/domain/lists/types'

export default function ListsPage() {
  const { lists, loading, error, addList, renameList, removeList } = useListsContext()
  const [editingList, setEditingList] = useState<List | null>(null)

  async function handleRename(list: List) {
    setEditingList(list)
  }

  async function handleDelete(list: List) {
    if (confirm(`Delete "${list.name}"? Tasks will be moved to Inbox.`)) {
      try {
        await removeList(list.id)
      } catch {
        // Error handled by context
      }
    }
  }

  async function handleSubmit(name: string, color?: string) {
    if (editingList) {
      await renameList(editingList.id, name)
      setEditingList(null)
    } else {
      await addList(name, color)
    }
  }

  return (
    <div data-testid="lists-page" className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Lists</h1>
        <p className="text-sm text-text-muted mt-1">Organize your tasks</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="mb-6">
        <ListForm
          onSubmit={handleSubmit}
          initialName={editingList?.name}
        />
        {editingList && (
          <button
            onClick={() => setEditingList(null)}
            className="mt-2 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel editing
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="text-text-muted text-sm">
            No lists yet. Create your first list to get organized.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {lists.map((list) => (
            <ListItem
              key={list.id}
              list={list}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
