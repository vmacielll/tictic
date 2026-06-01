'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
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
  const queryClient = useQueryClient()

  const openModal = useCallback(async (taskId: string) => {
    try {
      const task = await queryClient.fetchQuery({
        queryKey: ['task', taskId],
        queryFn: ({ signal }) => getTask(taskId, signal).then(parseTask),
        staleTime: 0,
      })
      setSelectedTask(task)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch task:', error)
    }
  }, [queryClient])

  const closeModal = useCallback(() => {
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
