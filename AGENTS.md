# TickTick Clone - Agent Instructions

## Project Structure

NOT a monorepo. Each app (`apps/server`, `apps/web`, `apps/e2e`) has its own `package.json`.
Use `Makefile` for orchestrated commands.

```
tictic/
├── apps/server/          # Backend (Fastify + Clean Architecture + DDD)
│   └── src/
│       ├── modules/     # Domain modules (auth, tasks, lists, calendar, pomodoro)
│       ├── infra/       # Database (Prisma)
│       ├── shared/      # Errors, middleware, utils
│       └── __tests__/   # Shared test utilities
├── apps/web/            # Frontend (Next.js 14 App Router)
├── apps/e2e/            # E2E tests (Playwright)
└── Makefile             # Orchestrated commands
```

## Key Commands

```bash
make setup      # First run: install deps + generate Prisma client
make dev        # Start DB + server + web
make test       # Run unit tests (server only)
make db-migrate # Run Prisma migrations

# Individual:
cd apps/server && npm test              # Run server tests
cd apps/server && npm run test:watch    # Watch mode
```

## Path Aliases (Server)

In `apps/server/src/` use these aliases:
- `@modules/*` → `modules/*`
- `@shared/*` → `shared/*`
- `@infra/*` → `infra/*`
- `@prisma/*` → `infra/database/prisma/*`
- `@tests/*` → `__tests__/*`

## Testing Utilities

```typescript
// apps/server/src/__tests__/utils/dateUtils.ts
import { testDate } from '@/__tests__/utils/dateUtils'

testDate(2024, 3, 15) // Returns Date with 12:00 UTC
// ⚠️ Luxon uses month 1-12 (NOT 0-11 like JS Date)
```

## Code Convention

**Write ALL code, comments, and logs in English** - even for internal code, variable names, and console messages. This ensures consistency across the codebase.

## Date Handling

- Use **Luxon** for all date operations
- Store dates in **UTC** in the database
- Convert to user's timezone at display time
- For tests, use `testDate()` helper to avoid timezone edge cases

## Prisma

- Schema: `apps/server/src/infra/database/prisma/schema.prisma`
- Generate client: `npx prisma generate --schema=apps/server/src/infra/database/prisma/schema.prisma`

## Commit Convention

- Use `type(scope): subject` format (Conventional Commits)
- **Subject only, no body** — keep commits concise
- Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`
- Scopes: `web`, `server`, `e2e`
- Examples: `fix(web): send x-csrf-token header on state-changing requests`

## Architecture Notes

- **Clean Architecture + DDD** in server
- Modules follow: `application/use-cases/`, `domain/`, `infra/repositories/`, `http/`
- Dependencies flow: HTTP → Controller → Use Case → Repository Interface ← Prisma