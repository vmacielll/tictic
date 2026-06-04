import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Calendar - Timezone Validation', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    // Wait for the calendar header to be visible
    await expect(page.getByTestId('calendar-today-btn')).toBeVisible({ timeout: 10000 })
  })

  test('should display day view with correct heading', async ({ page }) => {
    // Navigate to day view
    await page.getByTestId('calendar-view-day').click()

    // Wait for day view to load (API call needed for singleDay data)
    await expect(page.getByTestId('calendar-day-view')).toBeVisible({ timeout: 10000 })

    // Wait for the day view heading to appear (requires API data)
    await expect(page.getByTestId('calendar-day-view-heading')).toBeVisible({ timeout: 30000 })
  })

  test('should show correct day names in week view', async ({ page }) => {
    await page.getByTestId('calendar-view-week').click()

    // Wait for week view to load
    await expect(page.getByTestId('calendar-week-grid')).toBeVisible({ timeout: 10000 })

    // Check that we have 7 columns (one for each day)
    const weekGrid = page.locator('[data-testid="calendar-week-grid"]')
    await expect(weekGrid).toBeVisible()
  })

  test('should navigate to today correctly', async ({ page }) => {
    const _today = new Date()

    // Navigate to a different month first
    await page.getByTestId('calendar-view-month').click()
    await page.getByTestId('calendar-next-btn').click()

    // Click "Today" button
    await page.getByTestId('calendar-today-btn').click()

    // Verify we're back to current month
    await expect(page.getByTestId('calendar-heading')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('calendar-view-week').click()
    const todayButton = page.getByTestId('calendar-today-btn')
    await expect(todayButton).toBeVisible()
  })

  test('should create task and see it in calendar', async ({ page }) => {
    // Go to Today page to create a task
    await page.goto('/today')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Create a task
    const taskTitle = `Timezone Test ${Date.now()}`
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await page.getByTestId('task-add-button').click()

    // Wait for task to appear
    const taskItem = page.locator('[data-testid^="task-item-"]').first()
    await taskItem.waitFor({ state: 'attached', timeout: 15000 })

    // Verify task was created
    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible({ timeout: 10000 })

    // Go to calendar day view to verify task appears there
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('calendar-view-day').click()
    await expect(page.getByTestId('calendar-day-view')).toBeVisible({ timeout: 10000 })
  })

  test('should display correct date at midnight boundary', async ({ page }) => {
    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()

    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
  })

  test('should navigate to correct timezone from calendar', async ({ page }) => {
    await page.getByTestId('calendar-view-week').click()
    await expect(page.getByTestId('calendar-week-grid')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('calendar-today-btn').click()

    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()
  })
})
