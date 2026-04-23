import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load today page after login', async ({ page }) => {
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today/)
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  })

  test('should have sidebar with navigation links', async ({ page }) => {
    await page.goto('/today')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /Today/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /Inbox/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /Calendar/i })).toBeVisible()
  })

  test('should navigate to inbox via sidebar', async ({ page }) => {
    await page.goto('/today')
    await page.getByRole('link', { name: /Inbox/i }).click()
    await expect(page).toHaveURL(/\/inbox/)
    await expect(page.getByRole('heading', { name: /Inbox/i })).toBeVisible()
  })

  test('should navigate to calendar via sidebar', async ({ page }) => {
    await page.goto('/today')
    await page.getByRole('link', { name: /Calendar/i }).click()
    await expect(page).toHaveURL(/\/calendar/)
  })

  test('should have header with user info', async ({ page }) => {
    await page.goto('/today')
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })
})
