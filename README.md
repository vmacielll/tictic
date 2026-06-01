# TickTick Clone

A productivity app clone of [TickTick](https://ticktick.com) — tasks, lists, calendar views, and Pomodoro timer. Built with Clean Architecture + DDD.

**AI-ready** — includes `AGENTS.md` and `docs/` for coding agent guidance.

## Stack

| Layer | Tech |
|---|---|
| Backend | Fastify, TypeScript, Prisma, PostgreSQL |
| Frontend | Next.js 14, React, Tailwind CSS |
| Auth | JWT (access + refresh tokens), bcrypt, CSRF double-submit cookies |
| Testing | Vitest (488 unit tests), Playwright (35 E2E tests) |
| CI | GitHub Actions |

## Quick Start

```bash
cp .env.example .env          # Set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT
make setup                    # Install deps + generate Prisma client
make dev                      # Start PostgreSQL (Docker) + API + Web
```

- **API:** `http://localhost:3333`
- **Web:** `http://localhost:3000`
- **Stop:** `make down`

**Prerequisites:** Node.js ≥ 18, Docker and Docker Compose.

## Commands

```bash
make setup         # Install deps + generate Prisma client (first run)
make dev           # Start everything (DB + server + web)
make test          # Server (289) + web (199) unit tests
make test-all      # Unit + E2E tests
make e2e           # Playwright E2E (35 tests)
make db-migrate    # Run Prisma migrations
make db-studio     # Open Prisma Studio
make down          # Stop all services
```

Run `make help` for the full list.

## Features

- **Tasks** — CRUD with priorities, due dates/times, timezone-aware
- **Lists** — Custom lists with colors, task counts, pagination
- **Calendar** — Day, week, and month views
- **Pomodoro** — Active session tracking, accurate timer
- **Auth** — JWT with refresh token rotation, CSRF protection

## Architecture

Follows **Clean Architecture + DDD** with strict layer separation:

```
HTTP → Controller → Use Case → Repository Interface ← Prisma → PostgreSQL
```

| Module | Domain |
|---|---|
| `auth` | Registration, login, refresh tokens |
| `tasks` | Task CRUD, inbox, date-based queries |
| `lists` | List CRUD, task assignment |
| `calendar` | Date-range task views |
| `pomodoro` | Timer sessions |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full module layout, data flow, and component tree.

## AI Agent Support

This project is configured for AI coding agents:

- **[`AGENTS.md`](AGENTS.md)** — Root instructions for coding agents
- **[`docs/`](docs/)** — Progressive disclosure docs (architecture, testing, security, conventions)
- **[`.planning/`](.planning/)** — GSD roadmap with 15 phases, 83 items, 97.6% complete

## License

MIT
