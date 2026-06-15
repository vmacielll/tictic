'use client'

import { useEffect } from 'react'

let lockCount = 0

/**
 * Applies `inert` to #app-shell while active, using ref-counting
 * so nested dialogs don't prematurely remove it when the inner one closes.
 */
export function useInertApp(isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return

    lockCount++
    document.getElementById('app-shell')?.setAttribute('inert', '')

    return () => {
      lockCount--
      if (lockCount <= 0) {
        document.getElementById('app-shell')?.removeAttribute('inert')
        lockCount = 0
      }
    }
  }, [isActive])
}
