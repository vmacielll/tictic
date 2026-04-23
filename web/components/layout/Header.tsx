'use client'

import { useState, useEffect } from 'react'
import { getUserFromToken, removeToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const pageLabels: Record<string, string> = {
  '/today': 'Today',
  '/inbox': 'Inbox',
  '/calendar': 'Calendar',
  '/pomodoro': 'Pomodoro',
}

export function Header({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [pageLabel, setPageLabel] = useState('')

  useEffect(() => {
    const user = getUserFromToken()
    if (user) setUserName(user.name)
  }, [])

  useEffect(() => {
    const path = window.location.pathname
    setPageLabel(pageLabels[path] || '')
  }, [])

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  return (
    <header className={`h-14 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 ${className}`}>
      <div className="flex items-center gap-2">
        {pageLabel && (
          <span className="text-sm text-text-muted">{pageLabel}</span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-raised"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        <span>Sign out</span>
      </button>
    </header>
  )
}
