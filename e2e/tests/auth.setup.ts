import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '../test-results/.auth/storageState.json')
const tokenFile = path.join(__dirname, '../test-results/.auth/token.json')

setup('authenticate via register', async ({ page }) => {
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

  const setCookieHeader = loginResponse.headers()['set-cookie']
  const accessTokenMatch = setCookieHeader?.match(/accessToken=([^;]+)/)
  const refreshTokenMatch = setCookieHeader?.match(/refreshToken=([^;]+)/)

  const accessToken = accessTokenMatch?.[1]
  const refreshToken = refreshTokenMatch?.[1]

  expect(accessToken).toBeTruthy()

  await page.goto('/login')

  await page.evaluate(({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    document.cookie = `token=${accessToken}; path=/; max-age=900; SameSite=Lax`
  }, { accessToken, refreshToken })

  await page.goto('/today')
  await page.waitForURL(/\/today/, { timeout: 10000 })

  const hasToken = await page.evaluate(() => !!localStorage.getItem('accessToken'))
  expect(hasToken).toBeTruthy()

  await expect(page).toHaveURL(/\/(today|inbox)/)

  await page.context().storageState({ path: authFile })

  fs.writeFileSync(tokenFile, JSON.stringify({ accessToken, refreshToken }), 'utf-8')
})
