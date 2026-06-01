# Testing

## Test Counts

| Suite | Files | Tests | Runner |
|---|---|---|---|
| Server (unit) | 36 | 289 | vitest |
| Server (integration) | 5 | — | vitest |
| Web (unit) | 17 | 199 | vitest |
| E2E | 7 | 35 | Playwright |

## Running Tests

```bash
make test         # Server + web unit tests
make test-all     # All tests including E2E
make e2e          # E2E only (starts services automatically)

# Individual
cd server && npm test                # Server unit tests
cd server && npm run test -- src/integration/   # Server integration tests
cd web && npm test                   # Web unit tests
cd e2e && npx playwright test        # E2E tests
cd e2e && npx playwright test --ui   # Interactive E2E
```

---

## Server Test Patterns

### Unit Tests

Co-located with source files (`*/.test.ts`). Use vitest with `vi.mock` for dependency injection. Repository interfaces are mocked; use cases are tested in isolation.

### Integration Tests

Located at `server/src/integration/`. Test full HTTP request/response cycles against a real Fastify instance. Use in-memory mock Prisma data stores.

### TestAppFactory

```typescript
import { createTestApp } from '@/__tests__/utils/testAppFactory'

const { app, generateToken } = await createTestApp()
// Returns Fastify instance with JWT + CORS + authenticate decorator pre-configured
const token = generateToken(app, 'test-user-id')
```

### Date Utilities

```typescript
import { testDate } from '@/__tests__/utils/dateUtils'
testDate(2024, 3, 15) // Returns Date at 12:00 UTC
// ⚠️ Luxon months are 1-12 (NOT 0-11 like JS Date)
```

---

## Web Test Patterns

### Hook Tests

Each hook has a co-located test file. API functions are mocked via `vi.mock('@/lib/api')`, then hooks are tested via `@testing-library/react`'s `renderHook` + `waitFor`.

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
vi.mock('@/lib/api', () => ({ listTasks: vi.fn(), createTask: vi.fn() }))
```

### Component Tests

Components are tested via `@testing-library/react`'s `render` + `screen`. Focus on user interactions, rendering states, and error handling.

### Domain Tests

Zod schemas in `web/domain/` have dedicated test files that validate parsing of API response shapes to catch schema drift.

---

## E2E Test Patterns

### Key Conventions

- Use `data-testid` selectors exclusively (never CSS classes)
- Use `waitForResponse`/`waitForSelector` for synchronization (never `waitForTimeout`)
- Each test is self-contained: creates its own data, cleans up in `afterEach`
- Auth via cookie header (HttpOnly cookies — no direct token access)

### Cleanup

```typescript
import { cleanupUserData } from './utils/cleanup'
// afterEach: deletes all test data (tasks, lists, pomodoro sessions)
```
