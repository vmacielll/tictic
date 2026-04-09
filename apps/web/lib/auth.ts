export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

export function setToken(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  // Also set as cookie for middleware to detect authentication
  document.cookie = `token=${accessToken}; path=/; max-age=900; SameSite=Lax`
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  // Also remove cookie
  document.cookie = 'token=; path=/; max-age=0'
}

export function getUserFromToken(): { id: string; name: string; email: string } | null {
  const token = getToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.sub, name: payload.name || '', email: payload.email || '' }
  } catch {
    return null
  }
}
