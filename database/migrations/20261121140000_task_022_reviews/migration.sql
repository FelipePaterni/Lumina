CREATE TYPE "ReviewReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

CREATE TABLE "reviews" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "work_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" VARCHAR(2000) NOT NULL,
  "is_visible" BOOLEAN NOT NULL DEFAULT true,
  "moderation_reason" VARCHAR(500),
  "moderated_by_id" TEXT,
  "moderated_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE TABLE "review_reports" (
  "id" TEXT NOT NULL,
  "review_id" TEXT NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "status" "ReviewReportStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviews_user_id_work_id_key" ON "reviews"("user_id", "work_id");
CREATE INDEX "reviews_work_id_is_visible_created_at_idx" ON "reviews"("work_id", "is_visible", "created_at");
CREATE UNIQUE INDEX "review_reports_review_id_reporter_id_key" ON "review_reports"("review_id", "reporter_id");
CREATE INDEX "review_reports_status_created_at_idx" ON "review_reports"("status", "created_at");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
