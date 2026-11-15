FROM node:22-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Enable pnpm (version pinned by "packageManager" in package.json)
RUN corepack enable

WORKDIR /app

# Install dependencies
# pnpm-workspace.yaml holds allowBuilds (Prisma, bcrypt, esbuild need install scripts)
COPY apps/server/package.json ./package.json
COPY apps/server/pnpm-lock.yaml ./pnpm-lock.yaml
COPY apps/server/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/server/src ./src
COPY apps/server/tsconfig.json ./tsconfig.json
COPY apps/server/vitest.config.ts ./vitest.config.ts

# Copy Prisma schema and generate client
COPY apps/server/src/infra/database/prisma/schema.prisma ./src/infra/database/prisma/schema.prisma
RUN pnpm exec prisma generate --schema=src/infra/database/prisma/schema.prisma

# Build
RUN pnpm run build

EXPOSE 3333
CMD ["pnpm", "start"]
