'use client'

import { useLayoutEffect } from 'react'

/**
 * Sets --app-height CSS variable to the actual visible viewport height.
 * On iOS Safari, this dynamically tracks toolbar visibility changes
 * where dvh/lvh/svh units are delayed or don't update.
 */
export function useMobileViewport(): void {
  useLayoutEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const updateHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${vv.height}px`)
    }

    updateHeight()

    vv.addEventListener('resize', updateHeight)
    vv.addEventListener('scroll', updateHeight)

    return () => {
      vv.removeEventListener('resize', updateHeight)
      vv.removeEventListener('scroll', updateHeight)
    }
  }, [])
}
