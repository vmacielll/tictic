'use client'

import { TaskPageTemplate } from '@/components/tasks/TaskPageTemplate'

export default function TodayPage() {
  return (
    <TaskPageTemplate
      pageKey="today"
      title="Today"
      subtitle=""
      emptyMessage="No tasks for today"
      showDate
    />
  )
}
