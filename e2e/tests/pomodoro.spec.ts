import { test, expect } from '@playwright/test'

test.describe('Pomodoro', () => {
  test('should load pomodoro page', async ({ page }) => {
    await page.goto('/pomodoro')
    await expect(page).toHaveURL(/\/pomodoro/)
    await expect(page.getByRole('heading', { name: 'Pomodoro Timer' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Recent Sessions')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible()
  })

  test('should start a pomodoro session', async ({ page }) => {
    await page.goto('/pomodoro')
    await expect(page.getByRole('heading', { name: 'Pomodoro Timer' })).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Start Focus' }).click()

    // Timer should show time remaining (MM:SS format)
    await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible({ timeout: 5000 })

    // Status should show "Focusing"
    await expect(page.getByText('Focusing')).toBeVisible({ timeout: 5000 })
  })

  test('should cancel a pomodoro session', async ({ page }) => {
    await page.goto('/pomodoro')
    await expect(page.getByRole('heading', { name: 'Pomodoro Timer' })).toBeVisible({ timeout: 10000 })

    // Start a session
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await expect(page.getByText('Focusing')).toBeVisible({ timeout: 5000 })

    // Cancel the session
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Should show "New Session" button
    await expect(page.getByRole('button', { name: 'New Session' })).toBeVisible({ timeout: 5000 })
  })

  test('should show session in history after completion', async ({ page }) => {
    await page.goto('/pomodoro')
    await expect(page.getByRole('heading', { name: 'Pomodoro Timer' })).toBeVisible({ timeout: 10000 })

    // Start a session
    await page.getByRole('button', { name: 'Start Focus' }).click()
    await expect(page.getByText('Focusing')).toBeVisible({ timeout: 5000 })

    // Complete the session
    await page.getByRole('button', { name: 'Complete' }).click()

    // Should show "New Session" button
    await expect(page.getByRole('button', { name: 'New Session' })).toBeVisible({ timeout: 5000 })

    // Click "New Session" to reset
    await page.getByRole('button', { name: 'New Session' }).click()

    // Check recent sessions list
    await expect(page.getByText('Recent Sessions')).toBeVisible()
    // Session should appear in the history
    await expect(page.getByText('25m')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to pomodoro via sidebar', async ({ page }) => {
    await page.goto('/today')
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 10000 })

    await page.getByRole('link', { name: /Pomodoro/i }).click()
    await expect(page).toHaveURL(/\/pomodoro/)
    await expect(page.getByRole('heading', { name: 'Pomodoro Timer' })).toBeVisible()
  })

  test('should show pomodoro timer in task detail modal', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible({ timeout: 10000 })

    // Create a task
    const taskTitle = `Pomodoro Task ${Date.now()}`
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()

    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible()

    // Click on task to open detail modal
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ has: taskText }).first()
    await taskItem.locator('div.flex-1').click()

    // Modal should show Pomodoro section
    await expect(page.getByText('Pomodoro Focus')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible()

    // Cleanup: close modal and delete task
    await page.keyboard.press('Escape')
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })
})
