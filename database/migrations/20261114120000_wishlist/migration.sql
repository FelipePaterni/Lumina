CREATE TABLE "wishlist_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "work_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wishlist_items_user_id_work_id_key"
  ON "wishlist_items"("user_id", "work_id");
CREATE INDEX "wishlist_items_user_id_created_at_idx"
  ON "wishlist_items"("user_id", "created_at");

ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items"
  ADD CONSTRAINT "wishlist_items_work_id_fkey"
  FOREIGN KEY ("work_id") REFERENCES "works"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
