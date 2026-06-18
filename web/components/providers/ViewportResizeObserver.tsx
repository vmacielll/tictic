'use client'

import { useLayoutEffect } from 'react'

/**
 * Sets --app-height CSS variable to the actual visible viewport height.
 * Runs once at root level — all modals and fixed elements use this variable.
 *
 * On iOS Safari, visualViewport.height tracks:
 * - Toolbar show/hide (browser chrome changes)
 * - Keyboard open/close (soft keyboard)
 *
 * Unlike dvh/lvh/svh, this updates in real-time via resize/scroll events
 * and doesn't have the client-side navigation staleness bug.
 */
export function ViewportResizeObserver() {
  useLayoutEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      document.documentElement.style.setProperty('--app-height', `${vv.height}px`)
    }

    update()

    // Both resize AND scroll events are needed for iOS Safari
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return null
}
