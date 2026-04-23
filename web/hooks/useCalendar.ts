'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getCalendarMonth,
  getCalendarWeek,
  getCalendarDay,
  completeTask,
  uncompleteTask,
} from '@/lib/api'
import {
  type CalendarDay,
  type CalendarDayDetail,
  type CalendarDetailTask,
  parseCalendarDays,
  parseCalendarDayDetail,
} from '@/domain/calendar/types'

type CalendarView = 'month' | 'week' | 'day'

interface UseCalendarReturn {
  view: CalendarView
  setView: (view: CalendarView) => void
  currentDate: Date
  days: CalendarDay[]
  singleDay: CalendarDayDetail | null
  loading: boolean
  error: string | null
  goToPrev: () => void
  goToNext: () => void
  goToToday: () => void
  goToDay: (date: Date) => void
  onToggleTask: (id: string, completed: boolean) => Promise<void>
  refresh: () => Promise<void>
}

// Helper to format date as YYYY-MM-DD using local date (no UTC conversion)
function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useCalendar(initialView: CalendarView = 'month'): UseCalendarReturn {
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<CalendarDay[]>([])
  const [singleDay, setSingleDay] = useState<CalendarDayDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (view === 'month') {
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        const result = await getCalendarMonth(month, year)
        const parsed = result as { days: unknown[] }
        setDays(parseCalendarDays(parsed.days))
        setSingleDay(null)
      } else if (view === 'week') {
        const result = await getCalendarWeek(formatDateParam(currentDate))
        const parsed = result as { days: unknown[] }
        setDays(parseCalendarDays(parsed.days))
        setSingleDay(null)
      } else {
        const result = await getCalendarDay(formatDateParam(currentDate))
        setSingleDay(parseCalendarDayDetail(result))
        setDays([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data')
    } finally {
      setLoading(false)
    }
  }, [view, currentDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const goToPrev = () => {
    const date = new Date(currentDate)
    if (view === 'month') date.setMonth(date.getMonth() - 1)
    else if (view === 'week') date.setDate(date.getDate() - 7)
    else date.setDate(date.getDate() - 1)
    setCurrentDate(date)
  }

  const goToNext = () => {
    const date = new Date(currentDate)
    if (view === 'month') date.setMonth(date.getMonth() + 1)
    else if (view === 'week') date.setDate(date.getDate() + 7)
    else date.setDate(date.getDate() + 1)
    setCurrentDate(date)
  }

  const goToToday = () => setCurrentDate(new Date())
  const goToDay = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const onToggleTask = useCallback(async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await uncompleteTask(id)
      } else {
        await completeTask(id)
      }
      // Refresh calendar data after toggle
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task')
      throw err
    }
  }, [fetchData])

  return { view, setView, currentDate, days, singleDay, loading, error, goToPrev, goToNext, goToToday, goToDay, onToggleTask, refresh }
}
