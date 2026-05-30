'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { LIST_COLORS } from '@/domain/lists/types'

interface ListFormProps {
  onSubmit: (name: string, color?: string) => Promise<void>
  initialName?: string
}

export function ListForm({ onSubmit, initialName }: ListFormProps) {
  const [name, setName] = useState(initialName || '')
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync when initialName changes (e.g., clicking rename on a different list)
  useEffect(() => {
    if (initialName !== undefined) {
      setName(initialName)
    }
  }, [initialName])

  const isEditing = initialName !== undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 100) return

    setIsSubmitting(true)
    try {
      await onSubmit(trimmed, selectedColor)
      if (!isEditing) {
        setName('')
        setSelectedColor(undefined)
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="list-form" className="space-y-3">
      {/* Name input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          data-testid="list-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          maxLength={100}
          className="flex-1 px-3 py-2.5 text-sm bg-surface-raised border border-border-light rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          data-testid="list-add-button"
          disabled={!name.trim() || name.trim().length > 100 || isSubmitting}
          className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-600/20"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isEditing ? 'Save' : 'Create'}
        </button>
      </div>

      {/* Color picker — only in create mode */}
      {!isEditing && (
        <div data-testid="list-color-picker" className="flex items-center gap-1.5">
          {/* No color option */}
          <button
            type="button"
            onClick={() => setSelectedColor(undefined)}
            className={`w-6 h-6 rounded-full transition-all ${
              selectedColor === undefined
                ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-background'
                : 'hover:ring-1 hover:ring-border-light'
            }`}
            aria-label="No color"
          >
            <span className="flex items-center justify-center w-full h-full rounded-full bg-surface-overlay border border-border-light" />
          </button>

          <span className="w-px h-5 bg-border-light" />

          {/* Preset colors */}
          {LIST_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full transition-all ${
                selectedColor === color
                  ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-background'
                  : 'hover:ring-1 hover:ring-border-light'
              }`}
              aria-label={`Color ${color}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </form>
  )
}
