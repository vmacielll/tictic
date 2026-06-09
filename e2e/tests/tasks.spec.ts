import { test, expect } from '@playwright/test'
import { cleanupUserData } from './utils/cleanup'

test.describe('Tasks - Full CRUD Flow', () => {
  test.beforeEach(async () => {
    await cleanupUserData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')
  })

  test('should create, complete, and delete a task via UI', async ({ page }) => {
    const taskTitle = `E2E Test ${Date.now()}`

    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await expect(page.getByTestId('task-add-button')).toBeEnabled()

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
    )
    await page.getByTestId('task-add-button').click()
    const response = await responsePromise
    expect(response.status(), `Expected 201, got ${response.status()}`).toBe(201)

    // Wait for task to appear by text content
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 15000 })

    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).toHaveClass(/line-through/)

    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).not.toHaveClass(/line-through/)

    await taskItem.getByTestId('task-delete-button').click()
    await expect(taskItem).not.toBeVisible({ timeout: 10000 })
  })

  test('should show toast on task complete and reopen', async ({ page }) => {
    const taskTitle = `Toast Test ${Date.now()}`
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
    )
    await page.getByTestId('task-add-button').click()
    await responsePromise

    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 15000 })

    // Complete task — should show "Task completed" toast
    await taskItem.getByTestId('task-complete-button').click()
    await expect(page.getByTestId('toast-message')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('toast-message')).toContainText('Task completed')

    // Wait for toast to disappear, then reopen
    await expect(page.getByTestId('toast-message')).not.toBeVisible({ timeout: 6000 })

    // Reopen task — should show "Task reopened" toast
    await taskItem.getByTestId('task-complete-button').click()
    await expect(page.getByTestId('toast-message')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('toast-message')).toContainText('Task reopened')

    // Cleanup
    await taskItem.getByTestId('task-delete-button').click()
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
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible' })

    for (let i = 1; i <= 3; i++) {
      await taskInput.fill(`Task ${i} ${Date.now()}`)
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
      )
      await page.getByTestId('task-add-button').click()
      await responsePromise
    }

    const taskItems = await page.locator('[data-testid^="task-item-"]').count()
    expect(taskItems).toBeGreaterThanOrEqual(3)

    const task2Item = page.locator('[data-testid^="task-item-"]').filter({ hasText: 'Task 2' }).first()
    await expect(task2Item).toBeVisible({ timeout: 5000 })
    await task2Item.getByTestId('task-complete-button').click()
    await expect(task2Item.getByTestId('task-item-title')).toHaveClass(/line-through/)
  })

  test('should navigate between inbox and today', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    // Navigate to today via sidebar
    await page.getByTestId('nav-today').click()
    await expect(page).toHaveURL(/\/today/)
    await expect(page.getByTestId('page-heading')).toBeVisible()

    // Navigate to inbox via sidebar
    await page.getByTestId('nav-inbox').click()
    await expect(page).toHaveURL(/\/inbox/)
    await expect(page.getByTestId('page-heading')).toBeVisible()
  })

  test('should show priority selector on focus', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

    const taskInput = page.getByTestId('task-input')
    await taskInput.click()

    // Priority buttons should appear
    await expect(page.getByTestId('priority-L')).toBeVisible()
    await expect(page.getByTestId('priority-M')).toBeVisible()
    await expect(page.getByTestId('priority-H')).toBeVisible()
  })

  test('should complete and uncomplete a task multiple times', async ({ page }) => {
    const taskTitle = `Toggle Test ${Date.now()}`

    // Create task
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await page.getByTestId('task-add-button').click()

    // Wait for task to appear
    const taskItem = page.locator('[data-testid^="task-item-"]').first()
    await taskItem.waitFor({ state: 'attached', timeout: 15000 })
    
    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible()

    // Verify initial state: not completed
    await expect(taskItem.getByTestId('task-item-title')).not.toHaveClass(/line-through/)

    // Complete -> Uncomplete -> Complete (multiple toggles)
    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).toHaveClass(/line-through/)

    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).not.toHaveClass(/line-through/)

    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).toHaveClass(/line-through/)

    // Final state: completed
    await expect(taskItem.getByTestId('task-item-title')).toHaveClass(/line-through/)

    // Cleanup: delete the task
    await taskItem.getByTestId('task-delete-button').click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })

  test('should update task via detail modal', async ({ page }) => {
    const taskTitle = `Original Title ${Date.now()}`
    const newTitle = `Updated Title ${Date.now()}`
    const newDescription = 'This is the updated description'

    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await expect(page.getByTestId('task-add-button')).toBeEnabled()

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
    )
    await page.getByTestId('task-add-button').click()
    const response = await responsePromise
    expect(response.status(), `Expected 201, got ${response.status()}`).toBe(201)

    // Wait for task to appear by text content
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 15000 })

    await taskItem.hover()
    await taskItem.getByLabel('View task details').click()

    // Wait for modal to open
    const titleInput = page.getByTestId('modal-title-input')
    await expect(titleInput).toBeVisible({ timeout: 10000 })
    await titleInput.click()
    await titleInput.selectText()
    await titleInput.fill(newTitle)

    const descInput = page.getByTestId('modal-description-input')
    await descInput.fill(newDescription)

    await page.getByTestId('modal-save-button').click()

    // Wait for modal to close
    await expect(page.getByTestId('modal-title-input')).not.toBeVisible({ timeout: 10000 })

    // Verify the task list has been updated - look for the new title
    // The task list should refresh after save
    const updatedTaskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: newTitle }).first()
    await expect(updatedTaskItem).toBeVisible({ timeout: 15000 })
  })

  test('should complete tasks from today view', async ({ page }) => {
    await page.goto('/today')
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const taskTitle = `Today Task ${Date.now()}`
    const taskInput = page.getByTestId('task-input')
    await taskInput.waitFor({ state: 'visible', timeout: 10000 })
    await taskInput.fill(taskTitle)
    await expect(page.getByTestId('task-add-button')).toBeEnabled()

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/tasks') && resp.request().method() === 'POST'
    )
    await page.getByTestId('task-add-button').click()
    const response = await responsePromise
    expect(response.status(), `Expected 201, got ${response.status()}`).toBe(201)

    // Wait for task to appear by text content
    const taskItem = page.locator('[data-testid^="task-item-"]').filter({ hasText: taskTitle }).first()
    await expect(taskItem).toBeVisible({ timeout: 15000 })

    const taskText = page.getByText(taskTitle)
    await expect(taskText).toBeVisible({ timeout: 10000 })

    await taskItem.getByTestId('task-complete-button').click()
    await expect(taskItem.getByTestId('task-item-title')).toHaveClass(/line-through/)

    await taskItem.getByTestId('task-delete-button').click()
    await expect(taskText).not.toBeVisible({ timeout: 10000 })
  })
})
