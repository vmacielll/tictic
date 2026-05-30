import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Calendar', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })
  test('should load calendar page', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page).toHaveURL(/\/calendar/)
    await expect(page.getByTestId('calendar-view-month')).toBeVisible()
    await expect(page.getByTestId('calendar-view-week')).toBeVisible()
    await expect(page.getByTestId('calendar-view-day')).toBeVisible()
    await expect(page.getByTestId('calendar-today-btn')).toBeVisible()
    await expect(page.getByTestId('calendar-month-grid')).toBeVisible({ timeout: 10000 })
  })

  test('should switch between month, week, and day views', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    await page.getByTestId('calendar-view-week').click()
    await expect(page.getByTestId('calendar-week-grid')).toBeVisible()
    await page.getByTestId('calendar-view-day').click()
    await expect(page.getByTestId('calendar-day-view')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between months', async ({ page }) => {
    await page.goto('/calendar')
    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()
    const initialContent = await heading.textContent()
    await page.getByTestId('calendar-next-btn').click()
    await expect(heading).not.toHaveText(initialContent || '')
    await page.getByTestId('calendar-prev-btn').click()
    await expect(heading).toHaveText(initialContent || '')
  })

  test('should go to today with Today button', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByTestId('calendar-next-btn').click()
    await page.getByTestId('calendar-next-btn').click()
    await page.getByTestId('calendar-next-btn').click()
    await page.getByTestId('calendar-today-btn').click()
    const today = new Date()
    const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    await expect(page.getByTestId('calendar-heading')).toContainText(monthLabel, { ignoreCase: true })
  })
})
