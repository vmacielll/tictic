# TickTick Clone

A clone of [TickTick](https://ticktick.com) — productivity application for task management, lists, and Pomodoro technique.

## 🚀 Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| **Backend**   | Node.js, Fastify, TypeScript        |
| **Frontend**  | Next.js, React, TailwindCSS         |
| **Database**  | PostgreSQL, Prisma ORM              |
| **E2E Tests** | Playwright                          |
| **Monorepo**  | Turborepo, npm workspaces           |

## 📁 Project Structure

```
tictic/
├── apps/
│   ├── server/        # REST API (Fastify + Prisma)
│   ├── web/           # Frontend (Next.js + TailwindCSS)
│   └── e2e/           # End-to-end tests (Playwright)
├── packages/
│   └── shared/        # Shared types and utilities
├── docker-compose.yml
└── package.json
```

## 📋 Data Model

- **User** — application users
- **List** — task lists (belong to a user)
- **Task** — tasks with title, description, priority (`LOW`, `MEDIUM`, `HIGH`), due date/time, and completion status
- **PomodoroSession** — Pomodoro sessions linked to tasks, with duration and status (`RUNNING`, `COMPLETED`, `CANCELLED`)

## 🛠 Prerequisites

- **Node.js** >= 18
- **Docker** and **Docker Compose** (to run PostgreSQL via container)

## ⚡ Getting Started

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials (default values work for local development).

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run Prisma migrations

```bash
npm run db:migrate
```

### 5. Start the project

```bash
npm run dev
```

- Backend: `http://localhost:3333`
- Frontend: `http://localhost:3000`

## 📜 Available Scripts

| Command             | Description                                    |
|---------------------|------------------------------------------------|
| `npm run dev`       | Start all apps in development mode             |
| `npm run build`     | Production build of all apps                   |
| `npm run db:migrate`| Run Prisma migrations                          |
| `npm run db:studio` | Open Prisma Studio (database UI)               |
| `npm run e2e`       | Run E2E tests (headless)                       |
| `npm run e2e:ui`    | Run E2E tests with Playwright UI               |
| `npm run e2e:headed`| Run E2E tests with visible browser             |

Unit tests on the server:

```bash
cd apps/server && npm test
```

## 🐳 Docker Compose

The `docker-compose.yml` starts PostgreSQL and the backend together:

```bash
docker compose up -d
```

## 🧪 Tests

```bash
# Unit tests (server)
cd apps/server && npm test

# E2E tests
npm run e2e

# E2E tests with UI
npm run e2e:ui
```

## 🤝 Contributing

1. Fork the project
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📄 License

This project is open-source and under the MIT License.
