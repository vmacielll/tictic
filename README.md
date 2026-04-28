# TickTick Clone

A clone of [TickTick](https://ticktick.com) — productivity app with task management, lists, and Pomodoro timer.

## 🚀 Stack

| Layer          | Technologies                          |
|---------------|------------------------------------|
| **Backend**    | Fastify, TypeScript, Prisma         |
| **Frontend**   | Next.js 14, React, TailwindCSS   |
| **Database**   | PostgreSQL, Prisma ORM            |
| **Auth**      | JWT cookies, bcrypt            |
| **Tests**     | Vitest, Playwright           |
| **Task Runner**| Makefile                     |

## 🛠️ Prerequisites

- **Node.js** >= 18
- **Docker** and **Docker Compose**

## ⚡ Getting Started

```bash
make setup   # Install deps + generate Prisma
make dev    # Start DB + server + web
```

- **API**: `http://localhost:3333`
- **Web**: `http://localhost:3000`

## 📜 Commands

| Command        | Description                    |
|---------------|-------------------------------|
| `make dev`    | Start development             |
| `make test`   | Run unit tests               |
| `make e2e`   | Run E2E tests              |
| `make db-migrate` | Run migrations            |
| `make down`   | Stop all services           |

## 📁 Project Structure

```
tictic/
├── server/                 # Backend (Fastify)
│   └── src/
│       ├── modules/       # Domain modules (auth, tasks, lists, calendar, pomodoro)
│       ├── infra/         # Database (Prisma)
│       ├── shared/        # Errors, middleware, utils
│       └── __tests__/     # Test utilities
├── web/                    # Frontend (Next.js 14 App Router)
├── e2e/                    # E2E tests (Playwright)
└── Makefile                # Orchestrated commands
```

Path aliases: `@modules/*`, `@shared/*`, `@infra/*`, `@prisma/*`

## ✨ Features

- User authentication (JWT + bcrypt)
- Task management (CRUD, priorities, due dates/times)
- List organization (custom lists)
- Calendar views (day, week, month)
- Pomodoro timer with active session tracking
- Timezone-aware date handling

## 🛠️ Run Locally

```bash
# Install dependencies and generate Prisma client
make setup

# Start all services (DB + server + web)
make dev
```

- **API**: `http://localhost:3333`
- **Web**: `http://localhost:3000`
- **Stop**: `make down`

## 🏗️ Architecture

This project follows **Clean Architecture + DDD** (Domain-Driven Design):

```
HTTP Request → Controller → Use Case → Repository Interface ← Prisma Repository → PostgreSQL
```

### Modules

| Module | Responsibility |
|-------|---------------|
| **auth** | JWT authentication, login/register |
| **tasks** | CRUD tasks, priorities, due dates |
| **lists** | Task lists organization |
| **calendar** | Day/week/month view |
| **pomodoro** | Pomodoro timer |

### Testing

- **Unit**: Vitest
- **E2E**: Playwright

## 📄 License

MIT
