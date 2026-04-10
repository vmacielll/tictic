.PHONY: dev db-up db-down db-migrate db-reset setup help test e2e

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
	@echo "  make test        Run unit tests"
	@echo "  make e2e         Run E2E tests"
	@echo ""

# First-time setup: install deps + generate Prisma client
setup:
	@echo "Installing dependencies..."
	@cd apps/server && npm install
	@cd apps/web && npm install
	@cd apps/e2e && npm install
	@echo "Generating Prisma client..."
	@cd apps/server && npx prisma generate --schema=src/infra/database/prisma/schema.prisma
	@echo "Done! Run 'make dev' to start everything."

# Start everything: Postgres (Docker) + server + web with hot reload
dev:
	@echo "Starting database..."
	@docker compose up -d postgres
	@echo "Waiting for database to be ready..."
	@until docker compose exec postgres pg_isready -U postgres -q 2>/dev/null; do sleep 1; done
	@echo "Database ready!"
	@echo "Generating Prisma client..."
	@cd apps/server && npx prisma generate --schema=src/infra/database/prisma/schema.prisma 2>/dev/null
	@echo ""
	@echo "Starting server and web..."
	@echo ""
	@cd apps/server && npm run dev 2>&1 | sed 's/^/[API] /' & \
	 cd apps/web && npm run dev 2>&1 | sed 's/^/[WEB] /' & \
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
	@npx prisma migrate dev --schema=apps/server/src/infra/database/prisma/schema.prisma

# Open Prisma Studio
db-studio:
	@npx prisma studio --schema=apps/server/src/infra/database/prisma/schema.prisma

# Reset database (WARNING: drops all data)
db-reset:
	@echo "WARNING: This will drop all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@npx prisma migrate reset --schema=apps/server/src/infra/database/prisma/schema.prisma --force

# Run unit tests
test:
	@cd apps/server && npm run test

# Run E2E tests
e2e:
	@cd apps/e2e && npx playwright test
