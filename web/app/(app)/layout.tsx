'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { ListsProvider } from '@/contexts/ListsContext'
import { ToastProvider } from '@/components/ui/Toast'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? to show keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
      }
      // Esc to close shortcuts overlay
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showShortcuts])

  return (
    <ToastProvider>
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

        {/* Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="bg-surface-overlay rounded-xl shadow-2xl w-full max-w-md border border-border p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-surface-raised border border-border-light rounded text-text-muted text-xs font-mono">?</kbd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Close modal / overlay</span>
                  <kbd className="px-2 py-1 bg-surface-raised border border-border-light rounded text-text-muted text-xs font-mono">Esc</kbd>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center">Press <kbd className="px-1.5 py-0.5 bg-surface-raised border border-border-light rounded text-text-muted text-xs font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 bg-surface-raised border border-border-light rounded text-text-muted text-xs font-mono">Esc</kbd> to close</p>
            </div>
          </div>
        )}
      </ListsProvider>
    </ToastProvider>
  )
}
