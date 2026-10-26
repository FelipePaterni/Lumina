-- Rollback for 20261026080000_identity_and_auth
ALTER TABLE IF EXISTS "password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_user_id_fkey";
ALTER TABLE IF EXISTS "email_verification_tokens" DROP CONSTRAINT IF EXISTS "email_verification_tokens_user_id_fkey";

DROP TABLE IF EXISTS "outbox_emails";
DROP TABLE IF EXISTS "password_reset_tokens";
DROP TABLE IF EXISTS "email_verification_tokens";
DROP TABLE IF EXISTS "users";

DROP TYPE IF EXISTS "Role";

DELETE FROM "_prisma_migrations" WHERE migration_name = '20261026080000_identity_and_auth';
