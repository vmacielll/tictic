'use client'

import { useState, type FormEvent } from 'react'
import { type CreateTaskInput } from '@/lib/api'

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  placeholder?: string
  defaultDueDate?: string
}

export function TaskForm({ onSubmit, placeholder = 'Add a task...', defaultDueDate }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate || '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ 
        title: title.trim(), 
        description: description.trim() || undefined, 
        priority,
        dueDate: dueDate || undefined
      })
      setTitle('')
      setDescription('')
      setDueDate(defaultDueDate || '')
      setPriority('MEDIUM')
      setShowDetails(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowDetails(true)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
      </div>

      {showDetails && (
        <div className="flex items-center gap-3 px-1">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isSubmitting}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-1">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors
                  ${priority === p
                    ? p === 'HIGH' ? 'bg-red-100 text-red-700' : p === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {p.charAt(0)}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
