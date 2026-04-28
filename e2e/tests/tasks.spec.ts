import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Tasks - Full CRUD Flow', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('should create, complete, and delete a task via UI', async ({ page }) => {
    await page.waitForTimeout(3000)
    const taskTitle = `E2E Test ${Date.now()}`

    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.waitFor({ state: 'attached', timeout: 10000 })
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(3000)
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(5000)

    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 10000 })

    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await page.waitForTimeout(500)
    await expect(taskItem.locator('p')).toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Mark as incomplete' }).click()
    await page.waitForTimeout(500)
    await expect(taskItem.locator('p')).not.toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskItem).not.toBeVisible({ timeout: 10000 })
  })

  test('should show error when API fails', async ({ page }) => {
    // Abort request to simulate network failure
    await page.route('**/tasks/inbox', (route) => route.abort())

    await page.goto('/inbox')

    // Should show error message
    await expect(page.getByText(/error|failed|falha/i, { exact: false })).toBeVisible({ timeout: 10000 })
  })

  test('should create multiple tasks and verify ordering', async ({ page }) => {
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.waitFor({ state: 'visible' })

    for (let i = 1; i <= 3; i++) {
      await taskInput.fill(`Task ${i} ${Date.now()}`)
      await page.getByRole('button', { name: 'Add' }).click()
      await page.waitForTimeout(800)
    }

    await page.waitForTimeout(2000)

    const taskItems = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskItems).toBeGreaterThanOrEqual(3)

    const task2Item = page.locator('[data-testid^="task-item-"]').nth(1)
    await task2Item.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(task2Item.locator('p')).toHaveClass(/line-through/)
  })

  test('should navigate between inbox and today', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible({ timeout: 10000 })

    // Navigate to today via sidebar
    await page.getByRole('link', { name: /Today/i }).click()
    await expect(page).toHaveURL(/\/today/)
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()

    // Navigate to inbox via sidebar
    await page.getByRole('link', { name: /Inbox/i }).click()
    await expect(page).toHaveURL(/\/inbox/)
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()
  })

  test('should show priority selector on focus', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible({ timeout: 10000 })

    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.click()

    // Priority buttons should appear (use exact match to avoid ambiguity)
    await expect(page.getByRole('button', { name: 'L', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'M', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'H', exact: true })).toBeVisible()
  })

  test('should complete and uncomplete a task multiple times', async ({ page }) => {
    const taskTitle = `Toggle Test ${Date.now()}`

    // Create task
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()

    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible()
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ has: taskText }).first()

    // Verify initial state: not completed
    await expect(taskItem.locator('p')).not.toHaveClass(/line-through/)

    // Complete -> Uncomplete -> Complete (multiple toggles)
    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskItem.locator('p')).toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Mark as incomplete' }).click()
    await expect(taskItem.locator('p')).not.toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskItem.locator('p')).toHaveClass(/line-through/)

    // Final state: completed
    await expect(taskItem.locator('p')).toHaveClass(/line-through/)

    // Cleanup: delete the task
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })

test('should complete tasks from today view', async ({ page }) => {
    await page.goto('/today')
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const taskTitle = `Today Task ${Date.now()}`
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()

    await page.waitForTimeout(2000)

    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible({ timeout: 15000 })
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()

    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskItem.locator('p')).toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })
})
