-- Add missing due_timezone column
ALTER TABLE "tasks" ADD COLUMN "due_timezone" TEXT;

-- Fix incorrect column types (TIMESTAMP → TEXT)
ALTER TABLE "tasks" ALTER COLUMN "due_date" SET DATA TYPE TEXT;
ALTER TABLE "tasks" ALTER COLUMN "due_time" SET DATA TYPE TEXT;

-- Create refresh_tokens table
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- Refresh tokens indexes and FK
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add missing indexes
CREATE INDEX "lists_user_id_idx" ON "lists"("user_id");
CREATE INDEX "pomodoro_sessions_user_id_idx" ON "pomodoro_sessions"("user_id");
CREATE INDEX "pomodoro_sessions_user_id_status_idx" ON "pomodoro_sessions"("user_id", "status");
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
CREATE INDEX "tasks_user_id_completed_idx" ON "tasks"("user_id", "completed");
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks"("user_id", "due_date");
CREATE INDEX "tasks_user_id_priority_idx" ON "tasks"("user_id", "priority");

-- Fix index naming
ALTER INDEX "tasks_userId_listId_idx" RENAME TO "tasks_user_id_list_id_idx";
