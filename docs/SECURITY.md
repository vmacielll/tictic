# Security

## CSRF Protection

This project uses the double-submit cookie pattern for all state-changing requests (POST, PATCH, DELETE):

1. Server sets an HttpOnly `csrf-token` cookie on first request
2. Frontend reads the cookie value via a companion endpoint
3. `web/lib/api.ts` automatically attaches the `x-csrf-token` header on mutations
4. Server validates that the header value matches the cookie value

All mutation routes (create, update, delete) are protected. GET routes are exempt.

## Authentication

### JWT Tokens

- Access tokens: short-lived JWTs (signed with `JWT_SECRET`)
- Refresh tokens: long-lived, stored in database, rotated on use (signed with `JWT_REFRESH_SECRET`)
- Tokens are transmitted via HttpOnly cookies (never in localStorage or headers)

### Auth Middleware

```typescript
import { AuthenticatedRequest } from '@shared/middleware/authMiddleware'
```

The middleware decorates every protected route with:
- `request.userId` — authenticated user's UUID
- `request.userTimezone` — user's IANA timezone string (defaults to `'UTC'`)

Usage in controllers:
```typescript
const req = request as AuthenticatedRequest
const { userId, userTimezone } = req
```

### Protected Routes (Server)

All GET, POST, PATCH, and DELETE routes pass through `app.authenticate` as a `preHandler`. The middleware validates the JWT and extracts user identity before the controller runs.

### Protected Routes (Web)

`web/middleware.ts` guards `/today`, `/inbox`, `/calendar`, `/pomodoro`, `/lists` — redirects to `/login` if no access token cookie is present.
