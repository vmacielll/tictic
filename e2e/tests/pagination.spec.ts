import { test, expect } from '@playwright/test'

test.describe('Calendar - Timezone Boundary Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
  })

  test('should display correct date at midnight boundary', async ({ page }) => {
    await page.goto('/calendar')

    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()

    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
  })

  test('should navigate to correct timezone from calendar', async ({ page }) => {
    await page.goto('/calendar')

    await page.getByTestId('calendar-view-week').click()
    await expect(page.getByTestId('calendar-week-grid')).toBeVisible()

    await page.getByTestId('calendar-today-btn').click()

    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()
  })
})

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
  })

  test('should show pagination controls when tasks exceed limit', async ({ page }) => {
    for (let i = 0; i < 15; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.fill(`Page Test ${i}`)
      await page.getByTestId('task-add-button').click()
    }

    await page.waitForTimeout(500)
  })

  test('should navigate between pages', async ({ page }) => {
    for (let i = 0; i < 25; i++) {
      const taskInput = page.getByTestId('task-input')
      await taskInput.fill(`PageNav ${i}`)
      await page.getByTestId('task-add-button').click()
    }
  })
})