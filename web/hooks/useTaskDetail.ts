'use client'

import { useState, useCallback } from 'react'
import { type Task } from '@/domain/tasks/types'

interface UseTaskDetailReturn {
  selectedTask: Task | null
  isModalOpen: boolean
  openModal: (task: Task) => void
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

  const openModal = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }, [])

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
        completedAt: !wasCompleted ? new Date() : undefined
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
