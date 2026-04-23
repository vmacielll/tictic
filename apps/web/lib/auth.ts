export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const token = document.cookie.match(/accessToken=([^;]+)/)
  return !!token
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  document.cookie = 'accessToken=; path=/; max-age=0'
  document.cookie = 'refreshToken=; path=/; max-age=0'
}
