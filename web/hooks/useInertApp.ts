'use client'

import { useEffect } from 'react'

let lockCount = 0

/** Reset for tests. Call in beforeEach to avoid test pollution. */
export function resetInertLockCount(): void {
  lockCount = 0
}

/**
 * Applies `inert` to #app-shell while active, using ref-counting
 * so nested dialogs don't prematurely remove it when the inner one closes.
 *
 * @param selector - Element ID to toggle inert on (default: 'app-shell')
 */
export function useInertApp(isActive: boolean, selector = 'app-shell'): void {
  useEffect(() => {
    if (!isActive) return

    const element = document.getElementById(selector)
    if (!element) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `useInertApp: element with id "${selector}" not found`
        )
      }
      return
    }

    lockCount++
    element.setAttribute('inert', '')

    return () => {
      lockCount--
      if (lockCount <= 0) {
        element.removeAttribute('inert')
        lockCount = 0
      }
    }
  }, [isActive, selector])
}
