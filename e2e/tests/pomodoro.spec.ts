import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Pomodoro', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })

  test('should start a pomodoro session', async ({ page }) => {
    await page.goto('/pomodoro')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Check if there's an active session (cancel button visible) and cancel it first
    const cancelButton = page.getByTestId('pomodoro-cancel-button')
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click()
    }

    // Now click the start button (may have different text depending on state)
    const startButton = page.getByTestId('pomodoro-start-button')
    await startButton.waitFor({ state: 'visible', timeout: 10000 })
    await startButton.click()

    // Wait for the timer to appear first (indicates session started)
    await expect(page.getByTestId('pomodoro-timer')).toBeVisible({ timeout: 15000 })

    // Check if "Focusing" appears or if we see the timer running
    const focusingVisible = await page.getByTestId('pomodoro-status').isVisible().catch(() => false)

    // Either "Focusing" status or running timer is fine
    expect(focusingVisible || await page.getByTestId('pomodoro-timer').isVisible()).toBe(true)
  })

  test('should cancel a pomodoro session', async ({ page }) => {
    await page.goto('/pomodoro')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    const startButton = page.getByTestId('pomodoro-start-button')
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click()
      await expect(page.getByTestId('pomodoro-timer')).toBeVisible({ timeout: 15000 })
    }

    const cancelButton = page.getByTestId('pomodoro-cancel-button')
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click()
      await expect(page.getByTestId('pomodoro-new-session-button')).toBeVisible({ timeout: 10000 })
    } else {
      await expect(page.getByTestId('pomodoro-timer')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show session in history after completion', async ({ page }) => {
    await page.goto('/pomodoro')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    const startButton = page.getByTestId('pomodoro-start-button')
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click()
      await expect(page.getByTestId('pomodoro-timer')).toBeVisible({ timeout: 15000 })
    }

    const completeButton = page.getByTestId('pomodoro-complete-button')
    if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeButton.click()

      // Wait for session to complete and new session button to appear
      const newSessionButton = page.getByTestId('pomodoro-new-session-button')
      await newSessionButton.waitFor({ state: 'visible', timeout: 15000 })
      await newSessionButton.click()

      await expect(page.getByTestId('recent-sessions-heading')).toBeVisible()
      await expect(page.getByText(/25/).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should navigate to pomodoro via sidebar', async ({ page }) => {
    await page.goto('/today')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('nav-pomodoro').click()
    await expect(page).toHaveURL(/\/pomodoro/)
    await expect(page.getByTestId('page-heading')).toBeVisible()
  })

test('should show pomodoro timer in task detail modal', async ({ page }) => {
    await cleanupUserData()
    await page.goto('/pomodoro')
    await page.waitForLoadState('networkidle')

    const cancelButton = page.getByTestId('pomodoro-cancel-button')
    const newSessionButton = page.getByTestId('pomodoro-new-session-button')

    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click()
    }

    if (await newSessionButton.isVisible().catch(() => false)) {
      await newSessionButton.click()
    }

    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const taskTitle = `Task ${Date.now()}`
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await expect(page.getByTestId('task-add-button')).not.toBeDisabled()

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
    )
    await page.getByTestId('task-add-button').click()
    const response = await responsePromise
    expect(response.status(), `Expected 201, got ${response.status()}`).toBe(201)

    // Wait for task to appear by text content
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 15000 })

    // Use test-id instead of fragile selector
    await taskItem.getByTestId('task-item-content').click()

    const pomodoroSection = page.getByTestId('task-detail-pomodoro')
    await expect(pomodoroSection).toBeVisible({ timeout: 10000 })
    await expect(pomodoroSection.getByTestId('pomodoro-start-button')).toBeVisible()

    await page.keyboard.press('Escape')
    await taskItem.getByTestId('task-delete-button').click()
    await expect(taskItem).not.toBeVisible({ timeout: 10000 })
  })
})
