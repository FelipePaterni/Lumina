DROP INDEX IF EXISTS "outbox_emails_delivery_status_next_attempt_at_created_at_idx";
DROP INDEX IF EXISTS "outbox_emails_event_key_key";

ALTER TABLE "outbox_emails"
  DROP COLUMN IF EXISTS "last_error_code",
  DROP COLUMN IF EXISTS "next_attempt_at",
  DROP COLUMN IF EXISTS "last_attempt_at",
  DROP COLUMN IF EXISTS "attempt_count",
  DROP COLUMN IF EXISTS "delivery_status",
  DROP COLUMN IF EXISTS "event_type",
  DROP COLUMN IF EXISTS "event_key";

DROP TYPE IF EXISTS "OutboxEmailStatus";
