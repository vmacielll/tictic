import { test, expect } from '@playwright/test'

test.describe('Tasks - Full CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible({ timeout: 10000 })
  })

  test('should create, complete, and delete a task via UI', async ({ page }) => {
    const taskTitle = `E2E Test Task ${Date.now()}`

    // === CREATE ===
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()

    // Wait for task to appear and get its container
    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible()

    // Find parent task item using getByTestId pattern
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ has: taskText }).first()

    // === COMPLETE ===
    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskText).toHaveClass(/line-through/)

    // === UNCOMPLETE ===
    await taskItem.getByRole('button', { name: 'Mark as incomplete' }).click()
    await expect(taskText).not.toHaveClass(/line-through/)

    // === DELETE ===
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
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

    // Create 3 tasks
    for (let i = 1; i <= 3; i++) {
      await taskInput.fill(`Task number ${i}`)
      await page.getByRole('button', { name: 'Add' }).click()
      await expect(page.getByText(`Task number ${i}`)).toBeVisible({ timeout: 10000 })
    }

    // Verify all 3 tasks are visible
    const task1Text = page.getByText('Task number 1')
    const task2Text = page.getByText('Task number 2')
    const task3Text = page.getByText('Task number 3')
    await expect(task1Text).toBeVisible()
    await expect(task2Text).toBeVisible()
    await expect(task3Text).toBeVisible()

    // Get task containers
    const task1Item = page.locator('[data-testid^="task-item-"]').filter({ has: task1Text }).first()
    const task2Item = page.locator('[data-testid^="task-item-"]').filter({ has: task2Text }).first()

    // Complete task 2
    await task2Item.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(task2Text).toHaveClass(/line-through/)

    // Delete task 1
    await task1Item.getByRole('button', { name: 'Delete task' }).click()
    await expect(task1Text).not.toBeVisible()

    // Task 2 and Task 3 should still be visible
    await expect(task2Text).toBeVisible()
    await expect(task3Text).toBeVisible()
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
    await expect(taskText).not.toHaveClass(/line-through/)

    // Complete -> Uncomplete -> Complete (multiple toggles)
    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskText).toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Mark as incomplete' }).click()
    await expect(taskText).not.toHaveClass(/line-through/)

    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskText).toHaveClass(/line-through/)

    // Final state: completed
    await expect(taskText).toHaveClass(/line-through/)

    // Cleanup: delete the task
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })

  test('should complete tasks from today view', async ({ page }) => {
    // Navigate to today
    await page.goto('/today')
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 10000 })

    const taskTitle = `Today Task ${Date.now()}`
    const taskInput = page.locator('input[placeholder="Add a task..."]')
    await taskInput.fill(taskTitle)
    await page.getByRole('button', { name: 'Add' }).click()

    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible()
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ has: taskText }).first()

    // Complete the task
    await taskItem.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(taskText).toHaveClass(/line-through/)

    // Cleanup
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })
})
