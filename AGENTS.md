# TickTick Clone

A full-stack task management app — Fastify API with Clean Architecture + Next.js 14 App Router + PostgreSQL.
Not a monorepo workspace. Each app (`server`, `web`, `e2e`) has its own `package.json`.

## Quick Start

```bash
cp .env.example .env          # Configure DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT
make setup                    # Install deps + generate Prisma client (first run)
make dev                      # Start PostgreSQL (Docker) + API (3333) + Web (3000)
```

## Essential Commands

```bash
make test          # Server (289) + web (199) unit tests
make e2e           # Start services + run Playwright E2E (35 tests)
make test-all      # Unit + E2E
make db-migrate    # Run Prisma migrations
make db-studio     # Open Prisma Studio
make down          # Stop all services
```

Use `make help` for all available commands.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `PORT` | Fastify server port (default: 3333) |

## Project Docs

See `docs/` for detailed guidance. The agent loads these only when relevant to the task.

| File | When to read |
|---|---|
| `docs/ARCHITECTURE.md` | Understanding project structure, module layout, data flow |
| `docs/CONVENTIONS.md` | Commit format, code style, date handling, path aliases, component patterns |
| `docs/TESTING.md` | Test commands, patterns, testAppFactory, E2E conventions |
| `docs/SECURITY.md` | CSRF protection, JWT auth, auth middleware |

## Prisma

```bash
# Schema: server/src/infra/database/prisma/schema.prisma
cd server && npx prisma generate --schema=src/infra/database/prisma/schema.prisma
cd server && npx prisma migrate dev --schema=src/infra/database/prisma/schema.prisma
```

## Planning

`.planning/` tracks project progress via GSD phases. Run `/gsd:progress` for current state.

## Agent Rules

- **Never push to remote without explicit approval.** Stage and commit only after presenting a summary and getting confirmation.
- **Before committing, always present a summary** of what was changed and wait for approval.
- Include affected files, purpose of changes, and any risks or follow-ups needed.

## Maintenance

When the project changes in ways that affect documentation, update these files proactively:

- **`AGENTS.md`** — if commands, env vars, or doc links become stale
- **`README.md`** — if stack, features, or setup steps change
- **`docs/*.md`** — if architecture, conventions, testing patterns, or security details change
