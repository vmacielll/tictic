'use client'

import { TaskPageTemplate } from '@/components/tasks/TaskPageTemplate'

export default function InboxPage() {
  return (
    <TaskPageTemplate
      pageKey="inbox"
      title="Inbox"
      subtitle="Quick capture your tasks"
      emptyMessage="Your inbox is empty — add a task above!"
    />
  )
}
