import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '../test-results/.auth/storageState.json')
const tokenFile = path.join(__dirname, '../test-results/.auth/token.json')

setup('authenticate via register', async ({ page, context: _context }) => {
  const testEmail = `e2e+${Date.now()}@test.com`
  const testPassword = 'e2etestpassword123'

  const registerResponse = await page.request.post('http://localhost:3333/auth/register', {
    data: { name: 'E2E Test User', email: testEmail, password: testPassword }
  })

  expect(registerResponse.ok()).toBeTruthy()

  const loginResponse = await page.request.post('http://localhost:3333/auth/login', {
    data: { email: testEmail, password: testPassword }
  })

  expect(loginResponse.ok()).toBeTruthy()

  const loginBody = await loginResponse.json()
  const accessToken = loginBody.accessToken
  const refreshToken = loginBody.refreshToken

  expect(accessToken).toBeTruthy()
  expect(refreshToken).toBeTruthy()

  // Store tokens in localStorage (Bearer auth)
  await page.goto('/login')
  await page.evaluate((tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }, { accessToken, refreshToken })

  await page.goto('/today')
  await page.waitForURL(/\/today/, { timeout: 10000 })

  await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: 10000 })

  await expect(page).toHaveURL(/\/(today|inbox)/)

  await page.context().storageState({ path: authFile })

  fs.writeFileSync(tokenFile, JSON.stringify({ accessToken, refreshToken }), 'utf-8')
})
