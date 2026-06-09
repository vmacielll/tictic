'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  parseCalendarDays,
  parseCalendarDayDetail,
} from '@/domain/calendar/types'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarQueryResult {
  days: CalendarDay[]
  singleDay: CalendarDayDetail | null
}

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
  onToggleTask: (id: string, currentCompleted: boolean) => Promise<void>
  refresh: () => Promise<void>
}

// Helper to format date as YYYY-MM-DD using Luxon (no UTC conversion)
function formatDateParam(date: Date): string {
  return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
}

export function useCalendar(initialView: CalendarView = 'month'): UseCalendarReturn {
  const queryClient = useQueryClient()
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())

  const queryKey = ['calendar', view, currentDate.getTime()] as const

  const {
    data = { days: [], singleDay: null },
    isLoading,
    error: queryError,
  } = useQuery<CalendarQueryResult>({
    queryKey,
    queryFn: async ({ signal }) => {
      if (view === 'month') {
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        const result = await getCalendarMonth(month, year, signal)
        if (!result) return { days: [], singleDay: null }
        const parsed = result as unknown as { days: unknown[] }
        return { days: parseCalendarDays(parsed.days), singleDay: null }
      } else if (view === 'week') {
        const result = await getCalendarWeek(formatDateParam(currentDate), signal)
        if (!result) return { days: [], singleDay: null }
        const parsed = result as unknown as { days: unknown[] }
        return { days: parseCalendarDays(parsed.days), singleDay: null }
      } else {
        const result = await getCalendarDay(formatDateParam(currentDate), signal)
        if (!result) return { days: [], singleDay: null }
        return { days: [], singleDay: parseCalendarDayDetail(result) }
      }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await updateTask(id, { completed })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })

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

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const onToggleTask = async (id: string, currentCompleted: boolean) => {
    await toggleMutation.mutateAsync({ id, completed: !currentCompleted })
  }

  const error =
    toggleMutation.error instanceof Error
      ? toggleMutation.error.message
      : queryError instanceof Error
        ? queryError.message
        : null

  return {
    view,
    setView,
    currentDate,
    days: data.days,
    singleDay: data.singleDay,
    loading: isLoading,
    error,
    goToPrev,
    goToNext,
    goToToday,
    goToDay,
    onToggleTask,
    refresh,
  }
}
