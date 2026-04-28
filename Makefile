.PHONY: dev db-up db-down db-migrate db-reset setup help test test-all e2e down

# Default target
help:
	@echo ""
	@echo "TickTick Clone - Commands"
	@echo ""
	@echo "  make setup       Install deps + generate Prisma client (first run)"
	@echo "  make dev         Start everything (DB + server + web)"
	@echo "  make db-up       Start database only"
	@echo "  make db-down     Stop database"
	@echo "  make db-migrate  Run Prisma migrations"
	@echo "  make db-studio   Open Prisma Studio"
	@echo "  make db-reset    Reset database (drops all data)"
	@echo "  make test        Run unit tests (server + web)"
	@echo "  make test-all   Run all tests + E2E"
	@echo "  make e2e         Run E2E tests"
	@echo "  make down        Stop all services (server + web + DB)"
	@echo ""

# First-time setup: install deps and generate Prisma client
setup:
	@echo "Installing dependencies..."
	@cd server && npm install
	@cd web && npm install
	@cd e2e && npm install
	@echo "Generating Prisma client..."
	@cd server && npx prisma generate --schema=src/infra/database/prisma/schema.prisma
	@echo "Done! Run 'make dev' to start everything."

# Start everything: Postgres (Docker) + server + web with hot reload
dev:
	@echo "Starting database..."
	@docker compose up -d postgres
	@echo "Waiting for database to be ready..."
	@until docker compose exec postgres pg_isready -U postgres -q 2>/dev/null; do sleep 1; done
	@echo "Database ready!"
	@echo "Generating Prisma client..."
	@cd server && npx prisma generate --schema=src/infra/database/prisma/schema.prisma 2>/dev/null
	@echo ""
	@echo "Starting server and web..."
	@echo ""
	@cd server && npm run dev 2>&1 | sed 's/^/[API] /' & \
	 cd web && npm run dev 2>&1 | sed 's/^/[WEB] /' & \
	 wait

# Start database only
db-up:
	@docker compose up -d postgres
	@echo "Waiting for database to be ready..."
	@until docker compose exec postgres pg_isready -U postgres -q 2>/dev/null; do sleep 1; done
	@echo "Database ready!"

# Stop database
db-down:
	@docker compose down
	@echo "Database stopped."

# Run Prisma migrations
db-migrate:
	@cd server && npx prisma migrate dev --schema=src/infra/database/prisma/schema.prisma

# Open Prisma Studio
db-studio:
	@cd server && npx prisma studio --schema=src/infra/database/prisma/schema.prisma

# Reset database (WARNING: drops all data)
db-reset:
	@echo "WARNING: This will drop all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd server && npx prisma migrate reset --schema=src/infra/database/prisma/schema.prisma --force

# Run unit tests (server + web)
test:
	@echo "Running server tests..."
	@cd server && npm run test
	@echo "Running web tests..."
	@cd web && npm run test

# Run E2E tests
e2e:
	@echo "Starting services for E2E tests..."
	@docker compose up -d postgres
	@echo "Waiting for database..."
	@until docker compose exec postgres pg_isready -U postgres -q 2>/dev/null; do sleep 1; done
	@echo "Starting server and web..."
	/bin/bash -c 'export NODE_ENV=test && cd server && npm run dev 2>&1 | sed "s/^/[API] /" &' &
	/bin/bash -c 'cd web && npm run dev 2>&1 | sed "s/^/[WEB] /" &' &
	sleep 8
	@echo "Running E2E tests..."
	@cd e2e && npx playwright test
	@sleep 2
	@pkill -f "tsx watch src/app.ts" || true
	@pkill -f "next dev" || true

# Run all tests + E2E
test-all: test e2e

# Stop all services (server + web + database)
down:
	@echo "Stopping server..."
	@pkill -f "tsx watch" || true
	@echo "Stopping web..."
	@pkill -f "next dev" || true
	@echo "Stopping database..."
	@docker compose down
	@echo "All services stopped."
