-- Rollback: 20261026120000_audit_and_account_deletion
-- Description: Drop audit_logs table and remove deactivation fields from users

DROP TABLE IF EXISTS "audit_logs";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "scheduled_deletion_at",
  DROP COLUMN IF EXISTS "deactivated_at";

DELETE FROM "_prisma_migrations"
WHERE migration_name = '20261026120000_audit_and_account_deletion';
