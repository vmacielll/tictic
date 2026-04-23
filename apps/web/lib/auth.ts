export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const token = document.cookie.match(/accessToken=([^;]+)/)
  return !!token
}

export function getUserFromToken(): { id: string; name: string; email: string } | null {
  if (typeof window === 'undefined') return null
  const token = document.cookie.match(/accessToken=([^;]+)/)
  if (!token) return null
  
  try {
    const payload = JSON.parse(atob(token[1].split('.')[1]))
    return { id: payload.sub, name: payload.name || '', email: payload.email || '' }
  } catch {
    return null
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  document.cookie = 'accessToken=; path=/; max-age=0'
  document.cookie = 'refreshToken=; path=/; max-age=0'
}
