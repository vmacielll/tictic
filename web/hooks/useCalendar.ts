'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'
import {
  getCalendarMonth,
  getCalendarWeek,
  getCalendarDay,
  updateTask,
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

// Helper to format date as YYYY-MM-DD using Luxon (no UTC conversion)
function formatDateParam(date: Date): string {
  return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
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
    const dt = DateTime.fromJSDate(currentDate)
    let newDate: DateTime
    if (view === 'month') newDate = dt.minus({ months: 1 })
    else if (view === 'week') newDate = dt.minus({ weeks: 1 })
    else newDate = dt.minus({ days: 1 })
    setCurrentDate(newDate.toJSDate())
  }

  const goToNext = () => {
    const dt = DateTime.fromJSDate(currentDate)
    let newDate: DateTime
    if (view === 'month') newDate = dt.plus({ months: 1 })
    else if (view === 'week') newDate = dt.plus({ weeks: 1 })
    else newDate = dt.plus({ days: 1 })
    setCurrentDate(newDate.toJSDate())
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
      await updateTask(id, { completed: !completed })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task')
      throw err
    }
  }, [fetchData])

  return { view, setView, currentDate, days, singleDay, loading, error, goToPrev, goToNext, goToToday, goToDay, onToggleTask, refresh }
}
