'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getMe } from '@/lib/api'
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

  useEffect(() => {
    async function loadUser() {
      try {
        const cachedUser = getUserFromToken()
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          const fetchedUser = await getMe()
          setUser(fetchedUser)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const refreshUser = async () => {
    try {
      const fetchedUser = await getMe()
      setUser(fetchedUser)
    } catch {
      setUser(null)
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

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
