'use client'

import { useEffect, useRef } from 'react'

// Module-level ref counter: only unlock body scroll when ALL consumers release
let lockCount = 0

/** Reset for tests. Call in beforeEach to avoid test pollution. */
export function resetScrollLockCount(): void {
  lockCount = 0
}

/**
 * Prevents body scroll when `isActive` is true, using ref-counting so
 * nested dialogs don't prematurely restore scroll when the inner one closes.
 */
export function useBodyScrollLock(isActive: boolean): void {
  const originalOverflow = useRef('')

  useEffect(() => {
    if (!isActive) return

    // Save original overflow before setting hidden
    originalOverflow.current = document.body.style.overflow
    lockCount++
    document.body.style.overflow = 'hidden'

    return () => {
      lockCount--
      if (lockCount <= 0) {
        document.body.style.overflow = originalOverflow.current
        lockCount = 0 // reset to avoid negative drift
      }
    }
  }, [isActive])
}
