'use client'

import { useState, useCallback, useRef } from 'react'
import { DateTime } from 'luxon'
import { type Task } from '@/domain/tasks/types'
import { getTask } from '@/lib/api'
import { parseTask } from '@/domain/tasks/types'

interface UseTaskDetailReturn {
  selectedTask: Task | null
  isModalOpen: boolean
  openModal: (taskId: string) => Promise<void>
  closeModal: () => void
  handleSave: (updatedTask: Task) => void
  handleDelete: (taskId: string) => void
  handleToggleComplete: (taskId: string, completed: boolean) => void
}

export function useTaskDetail(
  onUpdateTask: (updatedTask: Task) => void,
  onDeleteTask: (taskId: string) => void,
  onToggleTask: (taskId: string, completed: boolean) => void
): UseTaskDetailReturn {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const openModal = useCallback(async (taskId: string) => {
    // Abort any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    try {
      const raw = await getTask(taskId, abortRef.current.signal)
      if (!raw) return // Request was aborted
      const task = parseTask(raw)
      setSelectedTask(task)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch task:', error)
    }
  }, [])

  const closeModal = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsModalOpen(false)
    setSelectedTask(null)
  }, [])

  const handleSave = useCallback((updatedTask: Task) => {
    onUpdateTask(updatedTask)
    setSelectedTask(updatedTask)
  }, [onUpdateTask])

  const handleDelete = useCallback((taskId: string) => {
    onDeleteTask(taskId)
    closeModal()
  }, [onDeleteTask, closeModal])

  const handleToggleComplete = useCallback((taskId: string, wasCompleted: boolean) => {
    // Toggle the completed status
    onToggleTask(taskId, wasCompleted)

    // Update selected task if it's still open
    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        completed: !wasCompleted,
        completedAt: !wasCompleted ? DateTime.now().toJSDate() : undefined
      })
    }
  }, [onToggleTask, selectedTask])

  return {
    selectedTask,
    isModalOpen,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleComplete,
  }
}
