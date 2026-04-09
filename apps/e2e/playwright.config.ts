import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'chromium',
      use: {
        baseURL: 'http://localhost:3000',
        storageState: path.resolve(__dirname, 'test-results/.auth/storageState.json'),
      },
      dependencies: ['setup'],
    },
  ],
})
