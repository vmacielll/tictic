import { test, expect } from '@playwright/test'

test.describe('Calendar', () => {
  test('should load calendar page', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page).toHaveURL(/\/calendar/)
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Day', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible()
    await expect(page.getByTestId('calendar-month-grid')).toBeVisible()
  })

  test('should switch between month, week, and day views', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('button', { name: 'Week' }).click()
    await expect(page.getByTestId('calendar-week-grid')).toBeVisible()
    await page.getByRole('button', { name: 'Day', exact: true }).click()
    await expect(page.getByTestId('calendar-day-view-heading')).toBeVisible()
  })

  test('should navigate between months', async ({ page }) => {
    await page.goto('/calendar')
    const heading = page.getByTestId('calendar-heading')
    await expect(heading).toBeVisible()
    const initialContent = await heading.textContent()
    await page.getByRole('button', { name: '→' }).click()
    const nextContent = await heading.textContent()
    expect(nextContent).not.toBe(initialContent)
    await page.getByRole('button', { name: '←' }).click()
    const backContent = await heading.textContent()
    expect(backContent).toBe(initialContent)
  })

  test('should go to today with Today button', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('button', { name: '→' }).click()
    await page.getByRole('button', { name: '→' }).click()
    await page.getByRole('button', { name: '→' }).click()
    await page.getByRole('button', { name: 'Today' }).click()
    const today = new Date()
    const monthLabel = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    await expect(page.getByTestId('calendar-heading')).toContainText(monthLabel, { ignoreCase: true })
  })
})
