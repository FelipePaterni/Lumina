CREATE TABLE "staff_invitation_tokens" (
  "id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_invitation_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_invitation_tokens_token_hash_key"
  ON "staff_invitation_tokens"("token_hash");

CREATE INDEX "staff_invitation_tokens_user_id_expires_at_idx"
  ON "staff_invitation_tokens"("user_id", "expires_at");

ALTER TABLE "staff_invitation_tokens"
  ADD CONSTRAINT "staff_invitation_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
