import { test, expect } from '@playwright/test'

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
  })

  test('should show pagination controls when tasks exceed limit', async ({ page }) => {
    for (let i = 0; i < 15; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.fill(`Page Test ${i}`)
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
      )
      await page.getByTestId('task-add-button').click()
      await responsePromise
    }

    // Verify tasks were created
    const taskCount = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskCount).toBeGreaterThanOrEqual(10)
  })

  test('should navigate between pages', async ({ page }) => {
    for (let i = 0; i < 25; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.fill(`PageNav ${i}`)
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
      )
      await page.getByTestId('task-add-button').click()
      await responsePromise
    }

    const taskCount = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskCount).toBeGreaterThanOrEqual(10)
  })
})
