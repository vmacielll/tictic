'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { logout as apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const pageLabels: Record<string, string> = {
  '/today': 'Today',
  '/inbox': 'Inbox',
  '/calendar': 'Calendar',
  '/pomodoro': 'Pomodoro',
}

export function Header({ className = '' }: { className?: string }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [pageLabel, setPageLabel] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    setPageLabel(pageLabels[path] || '')
  }, [])

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      logout()
    }
  }

  return (
    <>
    <header className={`h-14 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 ${className}`}>
      <div className="flex items-center gap-2">
        {pageLabel && (
          <span className="text-sm text-text-muted">{pageLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-surface-raised min-h-[44px]"
          aria-label="Settings"
        >
          <Icon name="settings" className="w-4 h-4" />
        </Link>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-2 -mr-2 rounded-lg hover:bg-surface-raised min-h-[44px]"
        >
          <Icon name="logout" className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
    <ConfirmDialog
      isOpen={showLogoutConfirm}
      title="Sign out"
      message="Are you sure you want to sign out?"
      confirmLabel="Sign out"
      onConfirm={handleLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
  </>
  )
}
