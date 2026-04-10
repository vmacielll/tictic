FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY apps/server/package.json ./package.json
COPY apps/server/package-lock.json ./package-lock.json
RUN npm ci

# Copy source
COPY apps/server/src ./src
COPY apps/server/tsconfig.json ./tsconfig.json
COPY apps/server/vitest.config.ts ./vitest.config.ts

# Copy Prisma schema and generate client
COPY apps/server/src/infra/database/prisma/schema.prisma ./src/infra/database/prisma/schema.prisma
RUN npx prisma generate --schema=src/infra/database/prisma/schema.prisma

# Build
RUN npm run build

EXPOSE 3333
CMD ["npm", "start"]
