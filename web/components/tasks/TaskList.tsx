'use client'

import React from 'react'
import { type Task } from '@/domain/tasks/types'
import { TaskItem } from './TaskItem'
import { TaskForm } from './TaskForm'
import type { CreateTaskInput } from '@/domain/tasks/types'
import type { List } from '@/domain/lists/types'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  emptyMessage?: string
  onAddTask: (data: CreateTaskInput) => Promise<void>
  onToggleTask: (id: string, completed: boolean) => void
  onDeleteTask: (id: string) => void
  defaultDueDate?: string
  onViewDetails?: (taskId: string) => void
  lists?: List[]
}

export function TaskList({
  tasks,
  loading,
  emptyMessage = 'No tasks here yet',
  onAddTask,
  onToggleTask,
  onDeleteTask,
  defaultDueDate,
  onViewDetails,
  lists,
}: TaskListProps) {
  const listMap = React.useMemo(() => {
    const map = new Map<string, List>()
    if (lists) {
      for (const list of lists) {
        map.set(list.id, list)
      }
    }
    return map
  }, [lists])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={onAddTask} defaultDueDate={defaultDueDate} lists={lists} />

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-text-muted/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="text-text-muted text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onViewDetails={onViewDetails}
              list={listMap.get(task.listId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
