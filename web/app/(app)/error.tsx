'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-raised rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-secondary mb-4 text-sm">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
