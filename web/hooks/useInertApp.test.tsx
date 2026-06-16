import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInertApp, resetInertLockCount } from './useInertApp'

describe('useInertApp', () => {
  let appShell: HTMLDivElement

  beforeEach(() => {
    resetInertLockCount()
    // Create the #app-shell element that the hook targets
    appShell = document.createElement('div')
    appShell.id = 'app-shell'
    document.body.appendChild(appShell)
  })

  afterEach(() => {
    document.body.removeChild(appShell)
  })

  it('sets inert attribute on #app-shell when active', () => {
    renderHook(() => useInertApp(true))
    expect(appShell.hasAttribute('inert')).toBe(true)
  })

  it('removes inert attribute when deactivated', () => {
    const { unmount } = renderHook(() => useInertApp(true))
    expect(appShell.hasAttribute('inert')).toBe(true)
    unmount()
    expect(appShell.hasAttribute('inert')).toBe(false)
  })

  it('keeps inert when only one of two consumers releases (ref-counting)', () => {
    const { unmount: unmountA } = renderHook(() => useInertApp(true))
    const { unmount: unmountB } = renderHook(() => useInertApp(true))
    expect(appShell.hasAttribute('inert')).toBe(true)

    unmountA()
    expect(appShell.hasAttribute('inert')).toBe(true)

    unmountB()
    expect(appShell.hasAttribute('inert')).toBe(false)
  })

  it('does nothing when inactive', () => {
    renderHook(() => useInertApp(false))
    expect(appShell.hasAttribute('inert')).toBe(false)
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useInertApp(true))
    expect(appShell.hasAttribute('inert')).toBe(true)
    unmount()
    expect(appShell.hasAttribute('inert')).toBe(false)
  })

  it('uses custom selector when provided', () => {
    const customShell = document.createElement('div')
    customShell.id = 'custom-shell'
    document.body.appendChild(customShell)

    const { unmount } = renderHook(() => useInertApp(true, 'custom-shell'))
    expect(customShell.hasAttribute('inert')).toBe(true)
    expect(appShell.hasAttribute('inert')).toBe(false)

    unmount()
    document.body.removeChild(customShell)
  })

  it('warns when target element is missing (dev mode)', () => {
    // Vitest sets NODE_ENV to 'test'; mock it to 'development' for this test
    vi.stubEnv('NODE_ENV', 'development')

    // Remove #app-shell
    document.body.removeChild(appShell)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    renderHook(() => useInertApp(true))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('useInertApp: element with id "app-shell" not found')
    )

    warnSpy.mockRestore()
    vi.unstubAllEnvs()
    // Restore for afterEach cleanup
    document.body.appendChild(appShell)
  })

  it('resets lockCount via resetInertLockCount', () => {
    const { unmount } = renderHook(() => useInertApp(true))
    resetInertLockCount()
    unmount()
    // Should not throw or corrupt
  })
})
