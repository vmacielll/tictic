'use client'

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { type CreateTaskInput } from '@/domain/tasks/types'
import type { List } from '@/domain/lists/types'

const PRIORITY_CONFIG = {
  LOW: { bg: 'bg-success/10', text: 'text-success/80', ring: 'ring-success/30' },
  MEDIUM: { bg: 'bg-warning/10', text: 'text-warning/80', ring: 'ring-warning/30' },
  HIGH: { bg: 'bg-danger/10', text: 'text-danger/80', ring: 'ring-danger/30' },
} as const

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  placeholder?: string
  defaultDueDate?: string
  lists?: List[]
}

export function TaskForm({ onSubmit, placeholder = 'Add a task...', defaultDueDate, lists }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate || '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [listId, setListId] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDetails) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDetails(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDetails])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        listId,
      })
      setTitle('')
      setDescription('')
      setDueDate(defaultDueDate || '')
      setPriority('MEDIUM')
      setListId(undefined)
      setShowDetails(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      ref={formRef}
      onBlur={(e) => {
        if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
          setShowDetails(false)
        }
      }}
    >
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Main input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          data-testid="task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowDetails(true)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm bg-surface-raised border border-border-light rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          data-testid="task-add-button"
          disabled={!title.trim() || isSubmitting}
          className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-600/20"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Add'}
        </button>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="flex items-center gap-2 px-1 animate-fade-in">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-3 py-2 text-xs bg-surface-raised border border-border-light rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-2.5 py-2 text-xs bg-surface-raised border border-border-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-1">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => {
              const config = PRIORITY_CONFIG[p]
              const isActive = priority === p
              const labels = { LOW: 'Low', MEDIUM: 'Med', HIGH: 'High' }
              return (
                <button
                  key={p}
                  data-testid={`priority-${p[0]}`}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2 h-7 text-xs rounded-lg font-semibold transition-all
                    ${isActive
                      ? `${config.bg} ${config.text} ring-1 ${config.ring}`
                      : 'bg-surface-raised text-text-muted hover:bg-surface-overlay border border-border-light'
                    }`}
                  title={`${p.charAt(0) + p.slice(1).toLowerCase()} priority`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>

          {lists && lists.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">List:</label>
              <select
                data-testid="task-list-select"
                value={listId || ''}
                onChange={(e) => setListId(e.target.value || undefined)}
                className="px-2 py-1 text-xs bg-surface-raised border border-border-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">No list (Inbox)</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </form>
    </div>
  )
}
