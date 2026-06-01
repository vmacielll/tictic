'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
  }

  return (
    <nav
      data-testid="pagination"
      aria-label={`Page ${currentPage} of ${totalPages}`}
      className="flex items-center justify-center gap-1 mt-6"
    >
      <button
        data-testid="pagination-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
          text-text-secondary hover:bg-surface-raised hover:text-text-primary
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Previous page"
      >
        Previous
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-sm text-text-muted">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        data-testid="pagination-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
          text-text-secondary hover:bg-surface-raised hover:text-text-primary
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}