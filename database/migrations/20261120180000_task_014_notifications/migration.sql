CREATE TYPE "OutboxEmailStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'RETRY',
  'SENT',
  'FAILED'
);

ALTER TABLE "outbox_emails"
  ADD COLUMN "event_key" VARCHAR(160),
  ADD COLUMN "event_type" VARCHAR(80) NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN "delivery_status" "OutboxEmailStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_attempt_at" TIMESTAMPTZ(6),
  ADD COLUMN "next_attempt_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_error_code" VARCHAR(60);

UPDATE "outbox_emails"
SET "delivery_status" = CASE
      WHEN "sent_at" IS NULL THEN 'PENDING'::"OutboxEmailStatus"
      ELSE 'SENT'::"OutboxEmailStatus"
    END,
    "attempt_count" = CASE WHEN "sent_at" IS NULL THEN 0 ELSE 1 END;

CREATE UNIQUE INDEX "outbox_emails_event_key_key"
  ON "outbox_emails"("event_key");

CREATE INDEX "outbox_emails_delivery_status_next_attempt_at_created_at_idx"
  ON "outbox_emails"("delivery_status", "next_attempt_at", "created_at");
