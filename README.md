# TickTick Clone

A clone of [TickTick](https://ticktick.com) — productivity application for task management, lists, and Pomodoro technique.

## 🚀 Stack

| Layer           | Technologies                                     |
|-----------------|--------------------------------------------------|
| **Backend**     | Node.js, Fastify, TypeScript, tsx               |
| **Frontend**    | Next.js 14 (App Router), React, TailwindCSS     |
| **Database**    | PostgreSQL 16, Prisma ORM                       |
| **Auth**        | @fastify/jwt, bcrypt                            |
| **Unit Tests**  | Vitest with V8 coverage                         |
| **E2E Tests**   | Playwright                                      |
| **Date/Time**   | Luxon                                           |
| **Task Runner** | Makefile (replaced Turborepo)                   |

## 📁 Project Structure

```
tictic/
├── apps/
│   ├── server/                    # Backend API (Fastify + Clean Architecture)
│   │   ├── src/
│   │   │   ├── modules/           # Domain modules
│   │   │   │   ├── auth/          # Authentication and authorization
│   │   │   │   ├── tasks/         # Task management
│   │   │   │   ├── lists/         # Task lists
│   │   │   │   ├── calendar/      # Calendar views
│   │   │   │   ├── pomodoro/      # Pomodoro timer
│   │   │   │   └── repositories/  # (empty - repositories in modules)
│   │   │   ├── infra/             # Infrastructure
│   │   │   │   └── database/
│   │   │   │       └── prisma/    # Prisma schema and client
│   │   │   ├── shared/            # Shared code
│   │   │   │   ├── errors/        # Custom error classes
│   │   │   │   ├── events/        # Event system
│   │   │   │   ├── middleware/    # Fastify middlewares
│   │   │   │   ├── types/         # TypeScript types
│   │   │   │   └── utils/         # Utilities (e.g. timezone)
│   │   │   └── app.ts             # Application entry point
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── vitest.config.ts
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Frontend (Next.js App Router)
│   │   ├── app/
│   │   │   ├── (auth)/            # Auth route group
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (app)/             # App route group
│   │   │   │   ├── today/         # "Today" view
│   │   │   │   ├── inbox/         # Inbox
│   │   │   │   ├── calendar/      # Calendar view
│   │   │   │   └── pomodoro/      # Pomodoro timer
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── tasks/             # TaskItem, TaskList, TaskForm, TaskDetailModal
│   │   │   ├── pomodoro/          # PomodoroTimer
│   │   │   ├── calendar/          # MonthView, WeekView, DayView
│   │   │   ├── layout/            # Header, Sidebar
│   │   │   └── ui/                # Reusable UI components
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useTasks.ts
│   │   │   ├── useCalendar.ts
│   │   │   ├── usePomodoro.ts
│   │   │   └── useTaskDetail.ts
│   │   ├── domain/                # Domain types and Zod schemas
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── lists/
│   │   │   ├── calendar/
│   │   │   ├── pomodoro/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   └── auth.ts            # Auth utilities
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── vitest.config.ts
│   │
│   └── e2e/                       # End-to-end tests (Playwright)
│       ├── tests/
│       │   ├── pomodoro.spec.ts
│       │   └── calendar.spec.ts
│       └── playwright.config.ts
│
├── docker-compose.yml             # PostgreSQL container
├── .env.example                   # Environment variables
├── Makefile                       # Quick commands
└── README.md                      # This file
```

> **Note:** This project does NOT use Turborepo. Each app in `apps/` has its own `package.json` and must be managed independently or via the Makefile.

## 🏗️ Backend Architecture

The backend follows **Clean Architecture** with **Domain-Driven Design (DDD)** patterns:

### Module Structure

```
modules/<name>/
├── application/
│   └── use-cases/         # Use cases (business rules)
├── domain/
│   ├── entities/          # Domain entities
│   ├── repositories/      # Repository interfaces
│   ├── value-objects/     # Value Objects
│   └── types/             # Domain-specific types
├── infra/
│   └── repositories/      # Prisma repository implementations
├── http/
│   ├── *Controller.ts     # Fastify controllers
│   └── *.routes.ts        # Route definitions
└── index.ts               # Barrel exports
```

### Dependency Flow

```
HTTP Request → Controller → Use Case → Repository Interface ← Prisma Repository → Prisma Client → PostgreSQL
```

### Backend Modules

| Module       | Use Cases                                                                                 |
|--------------|-------------------------------------------------------------------------------------------|
| **auth**     | RegisterUser, LoginUser                                                                   |
| **tasks**    | CreateTask, UpdateTask, CompleteTask, UncompleteTask, DeleteTask, ListTasks, ListTasksByDate, ListInboxTasks |
| **lists**    | CreateList, UpdateList, DeleteList, ListUserLists                                         |
| **calendar** | GetCalendarMonth, GetCalendarWeek, GetCalendarDay                                         |
| **pomodoro** | StartPomodoro, CompletePomodoro, CancelPomodoro, ListPomodoros, GetActivePomodoro         |

## 📋 Data Model

### User
| Field          | Type       | Description                    |
|----------------|------------|--------------------------------|
| `id`           | UUID       | Unique identifier              |
| `email`        | String     | Email (unique)                 |
| `name`         | String     | User name                      |
| `passwordHash` | String     | Password hash (bcrypt)         |
| `createdAt`    | DateTime   | Creation date                  |
| `updatedAt`    | DateTime   | Update date                    |

**Relationships:**
- `lists`: List[] (1:N)
- `tasks`: Task[] (1:N)
- `pomodoroSessions`: PomodoroSession[] (1:N)

### List
| Field       | Type       | Description                    |
|-------------|------------|--------------------------------|
| `id`        | UUID       | Unique identifier              |
| `name`      | String     | List name                      |
| `color`     | String?    | List color (optional)          |
| `userId`    | UUID       | Owner user ID                  |
| `createdAt` | DateTime   | Creation date                  |

**Relationships:**
- `user`: User (N:1, Cascade Delete)
- `tasks`: Task[] (1:N)

### Task
| Field         | Type       | Description                         |
|---------------|------------|-------------------------------------|
| `id`          | UUID       | Unique identifier                   |
| `title`       | String     | Task title                          |
| `description` | String?    | Detailed description (optional)     |
| `priority`    | Priority   | LOW, MEDIUM, HIGH                   |
| `dueDate`     | DateTime?  | Due date                            |
| `dueTime`     | DateTime?  | Due time                            |
| `completed`   | Boolean    | Completion status                   |
| `completedAt` | DateTime?  | Completion date                     |
| `listId`      | UUID?      | List ID (optional)                  |
| `userId`      | UUID       | Owner user ID                       |
| `createdAt`   | DateTime   | Creation date                       |
| `updatedAt`   | DateTime   | Update date                         |

**Relationships:**
- `user`: User (N:1, Cascade Delete)
- `list`: List? (N:1, Set Null on Delete)
- `pomodoroSessions`: PomodoroSession[] (1:N)

### PomodoroSession
| Field         | Type            | Description                         |
|---------------|-----------------|-------------------------------------|
| `id`          | UUID            | Unique identifier                   |
| `userId`      | UUID            | User ID                             |
| `taskId`      | UUID?           | Linked task ID (optional)           |
| `duration`    | Int             | Duration in minutes                 |
| `startedAt`   | DateTime        | Start date/time                     |
| `completedAt` | DateTime?       | Completion date/time                |
| `status`      | PomodoroStatus  | RUNNING, COMPLETED, CANCELLED       |

**Relationships:**
- `user`: User (N:1, Cascade Delete)
- `task`: Task? (N:1, Set Null on Delete)

## 🛠️ Prerequisites

- **Node.js** >= 18
- **npm** >= 9
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

- **Backend API**: `http://localhost:3333`
- **Frontend**: `http://localhost:3000`

## 📜 Available Scripts

| Command             | Description                                        |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Start all apps in development mode                 |
| `npm run build`     | Production build of all apps                       |
| `npm run db:migrate`| Run Prisma migrations                              |
| `npm run db:studio` | Open Prisma Studio (database UI)                   |
| `npm run e2e`       | Run E2E tests (headless)                           |
| `npm run e2e:ui`    | Run E2E tests with Playwright UI                   |
| `npm run e2e:headed`| Run E2E tests with visible browser                 |
| `npm run e2e:debug` | Run E2E tests in debug mode                        |

### Unit Tests (Backend)

```bash
cd apps/server && npm test              # Run tests
cd apps/server && npm run test:watch    # Watch mode
cd apps/server && npm run test:coverage # With coverage
```

## 🔌 API Endpoints

### Authentication
| Method | Route            | Description               | Auth |
|--------|------------------|---------------------------|------|
| POST   | `/auth/register` | Register new user         | No   |
| POST   | `/auth/login`    | Login                     | No   |

### Tasks
| Method | Route            | Description                    | Auth |
|--------|------------------|--------------------------------|------|
| GET    | `/tasks`         | List user tasks                | Yes  |
| GET    | `/tasks/inbox`   | List inbox tasks               | Yes  |
| GET    | `/tasks/by-date` | List tasks by date             | Yes  |
| POST   | `/tasks`         | Create task                    | Yes  |
| PUT    | `/tasks/:id`     | Update task                    | Yes  |
| PATCH  | `/tasks/:id/complete` | Mark task as complete     | Yes  |
| PATCH  | `/tasks/:id/uncomplete` | Undo task completion    | Yes  |
| DELETE | `/tasks/:id`     | Delete task                    | Yes  |

### Lists
| Method | Route            | Description                    | Auth |
|--------|------------------|--------------------------------|------|
| GET    | `/lists`         | List user lists                | Yes  |
| POST   | `/lists`         | Create list                    | Yes  |
| PUT    | `/lists/:id`     | Update list                    | Yes  |
| DELETE | `/lists/:id`     | Delete list                    | Yes  |

### Calendar
| Method | Route                           | Description              | Auth |
|--------|---------------------------------|--------------------------|------|
| GET    | `/calendar/month/:year/:month`  | Month tasks              | Yes  |
| GET    | `/calendar/week/:year/:week`    | Week tasks               | Yes  |
| GET    | `/calendar/day/:year/:month/:day` | Day tasks              | Yes  |

### Pomodoro
| Method | Route                   | Description                    | Auth |
|--------|-------------------------|--------------------------------|------|
| POST   | `/pomodoro/start`       | Start Pomodoro session         | Yes  |
| POST   | `/pomodoro/:id/complete`| Complete session               | Yes  |
| POST   | `/pomodoro/:id/cancel`  | Cancel session                 | Yes  |
| GET    | `/pomodoro`             | List sessions                  | Yes  |
| GET    | `/pomodoro/active`      | Current active session         | Yes  |

### Health Check
| Method | Route      | Description           |
|--------|------------|-----------------------|
| GET    | `/health`  | Server status         |

> **Note:** Protected routes require `Authorization: Bearer <JWT_TOKEN>` header

## 🐳 Docker Compose

The `docker-compose.yml` starts PostgreSQL:

```bash
docker compose up -d    # Start
docker compose down     # Stop
docker compose logs -f  # View logs
```

## 🧪 Tests

### Unit Tests (Backend with Vitest)

```bash
cd apps/server
npm test              # Run all tests
npm run test:watch    # Watch mode (re-runs on save)
npm run test:coverage # With coverage report
```

### End-to-End (Playwright)

```bash
npm run e2e           # Headless (CI)
npm run e2e:ui        # Playwright UI
npm run e2e:headed    # Visible browser
npm run e2e:debug     # Step-by-step debug
```

## 🤝 Contributing

1. Fork the project
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📄 License

This project is open-source and under the MIT License.
