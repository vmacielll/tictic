import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../test-results/.auth/storageState.json')

setup('authenticate via register', async ({ page }) => {
  const testEmail = `e2e+${Date.now()}@test.com`
  const testPassword = 'e2etestpassword123'

  // Use API directly to register and login (bypassing UI hydration issues)
  const registerResponse = await page.request.post('http://localhost:3333/auth/register', {
    data: { name: 'E2E Test User', email: testEmail, password: testPassword }
  })
  
  expect(registerResponse.ok()).toBeTruthy()
  
  const loginResponse = await page.request.post('http://localhost:3333/auth/login', {
    data: { email: testEmail, password: testPassword }
  })
  
  expect(loginResponse.ok()).toBeTruthy()
  
  const loginData = await loginResponse.json()
  
  // Navigate to login page and set tokens
  await page.goto('/login')
  
  // Set the token via JavaScript
  await page.evaluate(({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    // Set cookie for middleware
    document.cookie = `token=${accessToken}; path=/; max-age=900; SameSite=Lax`
  }, { accessToken: loginData.accessToken, refreshToken: loginData.refreshToken })
  
  // Navigate to /today to verify authentication works
  await page.goto('/today')
  await page.waitForURL(/\/today/, { timeout: 10000 })

  // Verify we have a token in localStorage
  const hasToken = await page.evaluate(() => !!localStorage.getItem('accessToken'))
  expect(hasToken).toBeTruthy()

  // Verify we're on a protected page
  await expect(page).toHaveURL(/\/(today|inbox)/)

  // Save storage state so other tests can use it
  await page.context().storageState({ path: authFile })
})
