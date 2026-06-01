# Conventions

## Commit Convention

Use `type(scope): subject` format (Conventional Commits).

- **Subject only, no body** — keep commits concise
- **Types:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`
- **Scopes:** `web`, `server`, `e2e`

Examples:
- `feat(web): add rename and delete actions to list item`
- `fix(web): send x-csrf-token header on state-changing requests`
- `refactor(server): extract shared utilities and deduplicate patterns`
- `test(e2e): replace waitForTimeout with proper assertions`

## Code Style

- **All code, comments, and logs in English** — variables, console messages, JSDoc
- **No emojis** in code or comments
- **Use TypeScript strict mode** everywhere

## Date Handling

- Use **Luxon** for all date operations (server and web)
- Store dates in **UTC** in the database
- Convert to user's timezone (`request.userTimezone`) at display time
- Parse API date strings through domain Zod schemas (`parseTask()`, etc.)
- `dueDate` is stored as ISO date string (no time component) — deliberate for timezone simplicity
- For tests, use the `testDate()` helper to avoid timezone edge cases

## Path Aliases

### Server (`server/tsconfig.json`)

```typescript
'@modules/*'  → 'modules/*'
'@shared/*'   → 'shared/*'
'@infra/*'    → 'infra/*'
'@prisma/*'   → 'infra/database/prisma/*'
'@/*'         → 'src/*'
```

### Web (`web/tsconfig.json`)

```typescript
'@/*' → './*'
```

## Frontend Component Patterns

- Use `React.memo` on list items that re-render frequently
- Use `data-testid` attributes on interactive elements for E2E testability
- Use the `<Icon name="..." />` pattern from `components/ui/Icon.tsx` — don't inline SVGs
- Use the `ErrorMessage` component for consistent error display
- All interactive pages use `'use client'` directive
