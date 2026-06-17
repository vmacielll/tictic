import { defineConfig } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
    {
      name: 'webkit',
      use: {
        baseURL: 'http://localhost:3000',
        storageState: path.resolve(__dirname, 'test-results/.auth/storageState.json'),
      },
      dependencies: ['setup'],
    },
  ],
  webServer: [],
})