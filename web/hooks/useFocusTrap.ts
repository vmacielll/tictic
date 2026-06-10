'use client'

import { useEffect, useRef, useCallback } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps Tab / Shift+Tab focus within the returned container ref.
 * Auto-focuses the element matching `autoFocusSelector` (if provided),
 * otherwise the first focusable element. Restores focus on close.
 */
export function useFocusTrap(isActive: boolean, autoFocusSelector?: string) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const ref = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])

  useEffect(() => {
    if (!isActive) return

    const raf = requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) return

      const previouslyFocused = document.activeElement as HTMLElement | null

      // Auto-focus: prefer explicit selector, fallback to first focusable
      if (autoFocusSelector) {
        const target = container.querySelector<HTMLElement>(autoFocusSelector)
        target?.focus()
      } else {
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (focusable.length > 0) focusable[0].focus()
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (elements.length === 0) return

        const first = elements[0]
        const last = elements[elements.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      ;(container as any).__focusTrapCleanup = () => {
        document.removeEventListener('keydown', handleKeyDown)
        previouslyFocused?.focus()
      }
    })

    return () => {
      cancelAnimationFrame(raf)
      const container = containerRef.current
      if (container && (container as any).__focusTrapCleanup) {
        ;(container as any).__focusTrapCleanup()
        delete (container as any).__focusTrapCleanup
      }
    }
  }, [isActive, autoFocusSelector])

  return ref
}
