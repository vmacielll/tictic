import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    include: ['domain/**/*.test.ts', 'hooks/**/*.test.ts', 'hooks/**/*.test.tsx', 'components/**/*.test.tsx', 'app/**/*.test.tsx', 'lib/**/*.test.ts', 'contexts/**/*.test.tsx'],
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
