'use client'

import { useState, useEffect } from 'react'
import { getUserFromToken, removeToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = getUserFromToken()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {userName ? `Welcome, ${userName}!` : 'TickTick Clone'}
        </h2>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        Logout
      </button>
    </header>
  )
}
