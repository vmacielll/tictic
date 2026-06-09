'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getMe, registerAuthErrorCallback } from '@/lib/api'
import { getUserFromToken, removeToken } from '@/lib/auth'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }, [])

  // Register global auth error callback — triggers logout on expired/invalid token
  useEffect(() => {
    const unregister = registerAuthErrorCallback(logout)
    return unregister
  }, [logout])

  useEffect(() => {
    async function loadUser() {
      try {
        // Always fetch from API for accurate user data (JWT doesn't include name/email)
        const fetchedUser = await getMe()
        setUser(fetchedUser)
      } catch {
        // If API fails, try JWT as fallback (may have incomplete data)
        const cachedUser = getUserFromToken()
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const fetchedUser = await getMe()
      setUser(fetchedUser)
    } catch {
      // If API fails, try JWT as fallback (may have incomplete data)
      const cachedUser = getUserFromToken()
      if (cachedUser) {
        setUser(cachedUser)
      } else {
        setUser(null)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
