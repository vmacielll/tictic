import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Lists - Full CRUD Flow', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/lists')
    await expect(page.getByTestId('lists-page')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
  })

  test('should create a list', async ({ page }) => {
    const listName = `Test List ${Date.now()}`

    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(listName)
    await page.getByTestId('list-add-button').click()

    // Wait for the list item to appear
    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })
  })

  test('should view lists', async ({ page }) => {
    const listName = `View Test ${Date.now()}`

    // Create a list via UI
    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(listName)
    await page.getByTestId('list-add-button').click()

    // Wait for it to appear
    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })

    // Navigate away and back to verify it persists
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    await page.goto('/lists')
    await expect(page.getByTestId('lists-page')).toBeVisible({ timeout: 10000 })

    // The list should still be there
    const persistedItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(persistedItem).toBeVisible({ timeout: 10000 })
  })

  test('should rename a list', async ({ page }) => {
    const originalName = `Original ${Date.now()}`
    const newName = `Renamed ${Date.now()}`

    // Create a list
    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(originalName)
    await page.getByTestId('list-add-button').click()

    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: originalName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })

    // Click rename button
    await listItem.getByTestId('list-rename-button').click()

    // Type new name and save
    const renameInput = page.getByTestId('list-name-input')
    await renameInput.waitFor({ state: 'visible', timeout: 5000 })
    await renameInput.fill(newName)
    await page.getByTestId('list-add-button').click()

    // Verify the name updated
    const renamedItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: newName }).first()
    await expect(renamedItem).toBeVisible({ timeout: 10000 })
  })

  test('should delete a list with confirmation', async ({ page }) => {
    const listName = `Delete Test ${Date.now()}`

    // Create a list
    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(listName)
    await page.getByTestId('list-add-button').click()

    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })

    // Confirm deletion (dialog) — must be registered BEFORE clicking delete
    page.once('dialog', (dialog) => dialog.accept())

    // Click delete button
    await listItem.getByTestId('list-delete-button').click()

    // Verify the list is removed
    await expect(listItem).not.toBeVisible({ timeout: 10000 })
  })

  test('should navigate to list detail', async ({ page }) => {
    const listName = `Detail Test ${Date.now()}`

    // Create a list
    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(listName)
    await page.getByTestId('list-add-button').click()

    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })

    // Click the list item link to navigate to its detail page
    await listItem.locator('a').first().click()

    // Should navigate to /lists/:id
    await expect(page).toHaveURL(/\/lists\//)
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
  })

  test('should show list in sidebar', async ({ page }) => {
    const listName = `Sidebar Test ${Date.now()}`

    // Create a list via the UI
    const nameInput = page.getByTestId('list-name-input')
    await nameInput.waitFor({ state: 'visible', timeout: 10000 })
    await nameInput.fill(listName)
    await page.getByTestId('list-add-button').click()

    const listItem = page.locator('[data-testid^="list-item-"]').filter({ hasText: listName }).first()
    await expect(listItem).toBeVisible({ timeout: 15000 })

    // Navigate to inbox to verify sidebar shows the list
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    // Check the sidebar for the list
    const sidebarList = page.locator('[data-testid^="sidebar-list-"]').filter({ hasText: listName }).first()
    await expect(sidebarList).toBeVisible({ timeout: 10000 })
  })
})
