'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Icon } from '@/components/ui/Icon'

const navItems = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/inbox', label: 'Inbox', icon: 'inbox' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/pomodoro', label: 'Pomodoro', icon: 'pomodoro' },
]

export function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

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

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs font-semibold text-primary-400 ring-1 ring-primary-600/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
