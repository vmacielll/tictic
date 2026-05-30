'use client'

import Link from 'next/link'
import type { List } from '@/domain/lists/types'

interface ListItemProps {
  list: List
  onRename?: (list: List) => void
  onDelete?: (list: List) => void
}

export function ListItem({ list, onRename, onDelete }: ListItemProps) {
  return (
    <div
      data-testid={`list-item-${list.id}`}
      className="group flex items-center gap-3 px-4 py-3 bg-surface-raised rounded-lg border border-border-light hover:border-border transition-all"
    >
      <Link
        href={`/lists/${list.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.color || '#6b7280' }}
        />
        <span className="flex-1 text-sm font-medium text-text-primary truncate">
          {list.name}
        </span>
        {typeof list.taskCount === 'number' && (
          <span className="text-xs text-text-muted tabular-nums">
            {list.taskCount}
          </span>
        )}
      </Link>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
        {onRename && (
          <button
            data-testid="list-rename-button"
            onClick={(e) => { e.preventDefault(); onRename(list) }}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Rename list"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            data-testid="list-delete-button"
            onClick={(e) => { e.preventDefault(); onDelete(list) }}
            className="p-1 text-text-muted hover:text-danger transition-colors"
            aria-label="Delete list"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
