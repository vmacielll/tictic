'use client'

import { useEffect } from 'react'

// Module-level ref counter: only unlock body scroll when ALL consumers release
let lockCount = 0

/**
 * Prevents body scroll when `isActive` is true, using ref-counting so
 * nested dialogs don't prematurely restore scroll when the outer one closes.
 */
export function useBodyScrollLock(isActive: boolean): void {
  useEffect(() => {
    if (!isActive) return

    lockCount++
    document.body.style.overflow = 'hidden'

    return () => {
      lockCount--
      if (lockCount <= 0) {
        document.body.style.overflow = ''
        lockCount = 0 // reset to avoid negative drift
      }
    }
  }, [isActive])
}
