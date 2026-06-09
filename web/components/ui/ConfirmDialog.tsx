'use client'

import { useEffect, useId } from 'react'
import { Icon } from '@/components/ui/Icon'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'unset' }
    }
  }, [isOpen])

  const id = useId()

  if (!isOpen) return null

  const variantStyles = {
    danger: 'bg-danger hover:bg-danger/90 text-white',
    warning: 'bg-warning hover:bg-warning/90 text-white',
    default: 'bg-primary-600 hover:bg-primary-700 text-white',
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      role="alertdialog"
      data-testid="confirm-dialog"
      aria-modal="true"
      aria-labelledby={`confirm-dialog-title-${id}`}
      aria-describedby={`confirm-dialog-message-${id}`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-surface-overlay rounded-xl shadow-2xl w-full max-w-md border border-border p-6 animate-slide-up">
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
              <Icon name="trash" className="w-5 h-5 text-danger" />
            </div>
          )}
          <div className="flex-1">
            <h3 id={`confirm-dialog-title-${id}`} className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
            <p id={`confirm-dialog-message-${id}`} className="mt-2 text-sm text-text-secondary">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-raised border border-border-light rounded-lg hover:bg-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}