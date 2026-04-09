FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN npm ci --ignore-scripts=false

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=apps/server/src/infra/database/prisma/schema.prisma

# Build
RUN npm run build --workspace=@ticktick/server

EXPOSE 3333
CMD ["npm", "start", "--workspace=@ticktick/server"]
