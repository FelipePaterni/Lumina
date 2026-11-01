-- Migration: 20261026120000_audit_and_account_deletion
-- Description: Add audit_logs table and account deactivation/deletion fields to users

-- 1. Add deactivation and scheduled deletion fields to users
ALTER TABLE "users"
  ADD COLUMN "deactivated_at" TIMESTAMPTZ(6),
  ADD COLUMN "scheduled_deletion_at" TIMESTAMPTZ(6);

-- 2. Create audit_logs table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" "Role",
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Create indexes for performance and querying
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");
