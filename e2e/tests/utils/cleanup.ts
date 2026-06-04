import { request } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const tokenFile = path.join(__dirname, '../../test-results/.auth/token.json')

async function getAccessToken(): Promise<string | null> {
  try {
    if (fs.existsSync(tokenFile)) {
      const data = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))
      return data.accessToken
    }
  } catch {}
  return null
}

export async function cleanupUserData(): Promise<void> {
  const accessToken = await getAccessToken()
  if (!accessToken) return

  try {
    const context = await request.newContext({
      baseURL: 'http://localhost:3333',
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const tasksResponse = await context.get('/tasks')
    if (tasksResponse.ok()) {
      const data = await tasksResponse.json()
      const tasks = data.items || data.tasks || []
      for (const task of tasks) {
        await context.delete(`/tasks/${task.id}`).catch(() => {})
      }
    }

    const listsResponse = await context.get('/lists')
    if (listsResponse.ok()) {
      const data = await listsResponse.json()
      const lists = Array.isArray(data) ? data : (data.lists || [])
      for (const list of lists) {
        await context.delete(`/lists/${list.id}`).catch(() => {})
      }
    }

    const sessionsResponse = await context.get('/pomodoro')
    if (sessionsResponse.ok()) {
      const data = await sessionsResponse.json()
      const sessions = data.pomodoroSessions || data.sessions || []
      for (const session of sessions) {
        if (session.status === 'RUNNING') {
          await context.patch(`/pomodoro/${session.id}/cancel`).catch(() => {})
        }
      }
    }

    await context.dispose()
  } catch (e) {
    // Silently fail - cleanup is best-effort
    console.error('Cleanup failed:', e)
  }
}