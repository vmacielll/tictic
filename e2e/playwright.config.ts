import { defineConfig } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60000,
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
  webServer: [
    {
      command: 'cd ../server && npm run dev',
      url: 'http://localhost:3333',
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://tic:tic@localhost:5432/tic',
        JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
      },
    },
    {
      command: 'cd ../web && npm run dev',
      url: 'http://localhost:3000',
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
