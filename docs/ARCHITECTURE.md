# Architecture

## Server: Clean Architecture + DDD

The server follows Clean Architecture with strict layer separation and dependency inversion.

### Module Structure

Each domain module (`auth`, `tasks`, `lists`, `calendar`, `pomodoro`) follows this pattern:

```
modules/{name}/
├── application/use-cases/   # Business logic orchestration
├── domain/
│   ├── entities/            # Domain entities with encapsulated behavior
│   └── repositories/        # Repository interfaces (contracts)
├── infra/repositories/      # Prisma repository implementations
└── http/
    ├── {Name}Controller.ts  # Request handling + Zod validation
    ├── {name}.routes.ts     # Route registration
    └── schemas/             # Zod validation schemas
```

**Dependency flow:** `HTTP → Controller → Use Case → Repository Interface ← Prisma Implementation`

Use cases depend on repository interfaces, not implementations. Dependency injection happens in `app.ts`.

### Key Concepts

- **Domain entities** are plain classes with behavior methods (e.g., `Task.create()`, `User.changeName()`)
- **Value objects** wrap primitives with validation (e.g., `TaskTitle`, `Priority`)
- **Repository pattern** abstracts database access behind interfaces
- **Use cases** are single-responsibility classes (`CreateTask`, `ListTasks`, `UpdateTask`, etc.)
- **Controllers** handle HTTP concerns: parsing, validation, error formatting

### Shared Layer

```
server/src/shared/
├── errors/
│   ├── AppError.ts          # Base domain error (400/404/409)
│   └── HttpError.ts         # Generic HTTP error
├── middleware/
│   └── authMiddleware.ts    # JWT verify + userTimezone extraction
├── mappers/
│   ├── Mapper.ts            # Generic Mapper<TDomain, TPrisma> interface
│   ├── prismaTaskMapper.ts
│   ├── prismaListMapper.ts
│   ├── prismaUserMapper.ts
│   └── prismaPomodoroMapper.ts
├── utils/
│   ├── authorize.ts         # ensureOwnership() check
│   ├── handleError.ts       # Unified error handler
│   ├── validationError.ts   # ZodError → 400 response
│   ├── logger.ts            # Pino structured logging
│   └── timezone.ts          # User timezone extraction
└── types/
    └── pagination.ts        # PaginationParams { skip, take }
```

### Error Handling

All domain errors extend `AppError`. Controllers route exceptions through `handleError()` which maps error types to HTTP status codes. Zod validation failures go through `validationError()`.

---

## Web: Next.js 14 App Router

The frontend uses Next.js 14 with the App Router pattern.

### Route Groups

| Group | Layout | Routes |
|---|---|---|
| `(app)/` | Sidebar + Header + BottomNav + AuthContext + ListsContext | `/today`, `/inbox`, `/calendar`, `/pomodoro`, `/lists`, `/lists/[id]` |
| `(auth)/` | Minimal layout (no nav) | `/login`, `/register` |

### Component Organization

Components are split by feature domain:
- `components/tasks/` — TaskList, TaskItem, TaskForm, TaskDetailModal, TaskDetailForm
- `components/lists/` — ListForm, ListItem
- `components/calendar/` — MonthView, WeekView, DayView
- `components/pomodoro/` — PomodoroTimer
- `components/layout/` — Sidebar, Header, BottomNav
- `components/ui/` — Input, Icon, ErrorMessage, Pagination, Button, ErrorBoundary

### Data Flow

```
Components → Hooks → lib/api.ts → Server API
```

- `web/lib/api.ts` is a CSRF-protected fetch wrapper that auto-attaches `x-csrf-token` on mutations
- All dates are Luxon `DateTime` objects parsed from API ISO strings through Zod schemas
- Components use `'use client'` directive where they need interactivity

### Data Fetching

Each domain has a dedicated hook. Hooks use `AbortController` for request cancellation on unmount and snapshot+revert pattern for optimistic updates.

### Contexts

- **AuthContext** — User session and login state (wraps `(app)/` layout)
- **ListsContext** — Shared list data for sidebar and task forms (wraps `(app)/` layout)

### Domain Layer

`web/domain/` contains Zod schemas and TypeScript types per feature. Schemas validate API responses at runtime. Each domain exports `parse*()` functions that consume raw API data and return typed domain objects.

---

## E2E: Playwright

Tests at `e2e/tests/` cover full user workflows across auth, tasks, lists, pomodoro, calendar, pagination, and timezone handling.

Tests use `data-testid` selectors exclusively, `waitForResponse`/`waitForSelector` for synchronization (no `waitForTimeout`), and `cleanupUserData()` in `afterEach` for test isolation via cookie-based auth.
