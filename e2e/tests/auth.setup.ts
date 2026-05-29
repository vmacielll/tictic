import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '../test-results/.auth/storageState.json')
const tokenFile = path.join(__dirname, '../test-results/.auth/token.json')

setup('authenticate via register', async ({ page, context }) => {
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

  // Extract tokens from Set-Cookie header
  const setCookieHeader = loginResponse.headers()['set-cookie']
  const accessTokenMatch = setCookieHeader?.match(/accessToken=([^;]+)/)
  const refreshTokenMatch = setCookieHeader?.match(/refreshToken=([^;]+)/)
  const csrfTokenMatch = setCookieHeader?.match(/csrf_token=([^;]+)/)

  const accessToken = accessTokenMatch?.[1]
  const refreshToken = refreshTokenMatch?.[1]
  const csrfToken = csrfTokenMatch?.[1]

  expect(accessToken).toBeTruthy()

  // Set HttpOnly cookies directly in the browser context
  await context.addCookies([
    {
      name: 'accessToken',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    {
      name: 'refreshToken',
      value: refreshToken || '',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    {
      name: 'csrf_token',
      value: csrfToken || '',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Strict',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
  ])

  // Also store in localStorage for the frontend's auth state
  await page.goto('/login')
  await page.evaluate(({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }, { accessToken, refreshToken: refreshToken || '' })

  await page.goto('/today')
  await page.waitForURL(/\/today/, { timeout: 10000 })

  const hasToken = await page.evaluate(() => !!localStorage.getItem('accessToken'))
  expect(hasToken).toBeTruthy()

  await expect(page).toHaveURL(/\/(today|inbox)/)

  await page.context().storageState({ path: authFile })

  fs.writeFileSync(tokenFile, JSON.stringify({ accessToken, refreshToken }), 'utf-8')
})
