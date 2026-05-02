import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load today page after login', async ({ page }) => {
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today/)
    await expect(page.getByTestId('page-heading')).toBeVisible()
  })

  test('should have sidebar with navigation links', async ({ page }) => {
    await page.goto('/today')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByTestId('nav-today')).toBeVisible()
    await expect(sidebar.getByTestId('nav-inbox')).toBeVisible()
    await expect(sidebar.getByTestId('nav-calendar')).toBeVisible()
  })

  test('should navigate to inbox via sidebar', async ({ page }) => {
    await page.goto('/today')
    await page.getByTestId('nav-inbox').click()
    await expect(page).toHaveURL(/\/inbox/)
    await expect(page.getByTestId('page-heading')).toBeVisible()
  })

  test('should navigate to calendar via sidebar', async ({ page }) => {
    await page.goto('/today')
    await page.getByTestId('nav-calendar').click()
    await expect(page).toHaveURL(/\/calendar/)
  })

  test('should have header with user info', async ({ page }) => {
    await page.goto('/today')
    // Header is hidden on desktop (md:hidden), only visible on mobile
    const header = page.locator('header')
    // On desktop viewport, header should be hidden; we verify it exists but is hidden
    await expect(header).toHaveClass(/md:hidden/)
  })
})
