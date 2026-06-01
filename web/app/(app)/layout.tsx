'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { ListsProvider } from '@/contexts/ListsContext'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ListsProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="hidden md:flex" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header className="md:hidden" />
          <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ListsProvider>
  )
}
