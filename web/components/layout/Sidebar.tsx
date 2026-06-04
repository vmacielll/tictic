'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useListsContext } from '@/contexts/ListsContext'
import { logout as apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

const navItems = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/inbox', label: 'Inbox', icon: 'inbox' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/pomodoro', label: 'Pomodoro', icon: 'pomodoro' },
  { href: '/lists', label: 'Lists', icon: 'lists' },
]

export function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { lists, loading } = useListsContext()

  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      logout()
      router.push('/login')
    }
  }

  return (
    <aside className={`w-60 bg-surface border-r border-border flex flex-col h-full ${className}`}>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">TicTic</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-testid={`nav-${item.href.replace('/', '')}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-primary-600/10 text-primary-400'
                      : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                    }
                  `}
                >
                  <Icon name={item.icon} className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-400' : ''}`} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Lists section */}
      <div className="px-2.5 py-2 border-t border-border">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Lists</span>
          <Link href="/lists" className="text-text-muted hover:text-primary-400 transition-colors" data-testid="lists-add-link">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
        </div>
        {loading ? (
          <div className="px-3 py-2 text-xs text-text-muted">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="px-3 py-2 text-xs text-text-muted">No lists yet</div>
        ) : (
          <ul className="space-y-0.5">
            {lists.map((list) => {
              const isActive = pathname === `/lists/${list.id}`
              return (
                <li key={list.id}>
                  <Link
                    href={`/lists/${list.id}`}
                    data-testid={`sidebar-list-${list.id}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150
                      ${isActive ? 'bg-primary-600/10 text-primary-400' : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'}
                    `}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: list.color || '#6b7280' }} />
                    <span className="truncate">{list.name}</span>
                    <span className="ml-auto text-xs text-text-muted">{list.taskCount}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs font-semibold text-primary-400 ring-1 ring-primary-600/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
