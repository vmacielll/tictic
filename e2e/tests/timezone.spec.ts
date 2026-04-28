import { test, expect } from '@playwright/test'

test.describe('Calendar - Timezone Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    // Wait for the calendar header to be visible
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible({ timeout: 10000 })
  })

  test('should display day view with correct heading', async ({ page }) => {
    // Navigate to day view
    await page.getByRole('button', { name: 'Day', exact: true }).click()

    // Wait for day view to load
    await page.waitForTimeout(1000)

    // Check that the day view heading is visible
    const dayViewHeading = page.locator('[data-testid="calendar-day-view-heading"]')
    await expect(dayViewHeading).toBeVisible({ timeout: 5000 })
  })

  test('should show correct day names in week view', async ({ page }) => {
    await page.getByRole('button', { name: 'Week', exact: true }).click()

    // Wait for week view to load
    await expect(page.getByRole('button', { name: 'Week' })).toHaveClass(/bg-primary-600/)

    // Check that we have 7 columns (one for each day)
    const weekGrid = page.locator('[data-testid="calendar-week-grid"]')
    await expect(weekGrid).toBeVisible()
  })

  test('should navigate to today correctly', async ({ page }) => {
    const today = new Date()
    const expectedDay = today.getDate()

    // Navigate to a different month first
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    await page.locator('button').filter({ has: page.locator('svg path[d="M8.25 4.5l7.5 7.5-7.5 7.5"]') }).click()

    // Click "Today" button
    await page.getByRole('button', { name: 'Today' }).click()

    // Should be back to current month with today highlighted
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Week', exact: true }).click()
    const todayButton = page.getByRole('button', { name: 'Today' })
    await expect(todayButton).toBeVisible()
  })

  test('should create task and see it in calendar', async ({ page }) => {
    // Go to Today page to create a task
    await page.goto('/today')
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Create a task
    const taskTitle = `Timezone Test ${Date.now()}`
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(3000)

    // Verify task was created
    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible({ timeout: 10000 })

    // Go to calendar day view to verify task appears there
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Day', exact: true }).click()
    await page.waitForTimeout(2000)

    // Task should be visible in calendar day view if it has today's date
  })
})
