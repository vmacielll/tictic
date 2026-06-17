'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

const navItems = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/inbox', label: 'Inbox', icon: 'inbox' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/pomodoro', label: 'Pomodoro', icon: 'pomodoro' },
  { href: '/lists', label: 'Lists', icon: 'lists' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden flex-none bg-surface border-t border-border pb-safe">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
                  ${isActive ? 'text-primary-400' : 'text-text-secondary'}
                `}
              >
                <Icon name={item.icon} className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}