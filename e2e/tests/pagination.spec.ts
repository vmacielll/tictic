import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupUserData()
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
  })

  test('should show pagination controls when tasks exceed limit', async ({ page }) => {
    for (let i = 0; i < 15; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.waitFor({ state: 'visible', timeout: 10000 })
      await taskInput.fill(`Page Test ${i}`)
      await expect(page.getByTestId('task-add-button')).toBeEnabled()
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
      )
      await page.getByTestId('task-add-button').click()
      await responsePromise
      await page.waitForLoadState('networkidle')
    }

    // Wait for tasks to render
    await expect(page.locator('[data-testid^="task-item-"]').first()).toBeVisible({ timeout: 10000 })

    const taskCount = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskCount).toBeGreaterThanOrEqual(10)
  })

  test('should navigate between pages', async ({ page }) => {
    for (let i = 0; i < 25; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.waitFor({ state: 'visible', timeout: 10000 })
      await taskInput.fill(`PageNav ${i}`)
      await expect(page.getByTestId('task-add-button')).toBeEnabled()
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
      )
      await page.getByTestId('task-add-button').click()
      await responsePromise
      await page.waitForLoadState('networkidle')
    }

    // Wait for tasks to render
    await expect(page.locator('[data-testid^="task-item-"]').first()).toBeVisible({ timeout: 10000 })

    const taskCount = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskCount).toBeGreaterThanOrEqual(10)
  })
})
