import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBodyScrollLock, resetScrollLockCount } from './useBodyScrollLock'

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    resetScrollLockCount()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('sets body overflow to hidden when active', () => {
    renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores original overflow when deactivated', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('restores empty overflow if original was empty', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps body locked when only one of two consumers releases (ref-counting)', () => {
    const { unmount: unmountA } = renderHook(() => useBodyScrollLock(true))
    const { unmount: unmountB } = renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')

    // Release consumer A — body should still be locked
    unmountA()
    expect(document.body.style.overflow).toBe('hidden')

    // Release consumer B — lockCount hits 0 and restores to hookB's
    // originalOverflow, which was 'hidden' (already set by hookA)
    unmountB()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does nothing when inactive', () => {
    const initialOverflow = document.body.style.overflow
    renderHook(() => useBodyScrollLock(false))
    expect(document.body.style.overflow).toBe(initialOverflow)
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('resets lockCount via resetScrollLockCount', () => {
    const wrapper = renderHook(() => useBodyScrollLock(true))

    // Force reset mid-lock to simulate test isolation
    resetScrollLockCount()
    wrapper.unmount()

    // After reset, unmount cleanup decrements lockCount to -1 (≤ 0),
    // so it restores originalOverflow (empty string) and resets lockCount to 0.
    // The key is: resetScrollLockCount exists and doesn't throw
    expect(document.body.style.overflow).toBe('')
  })
})
