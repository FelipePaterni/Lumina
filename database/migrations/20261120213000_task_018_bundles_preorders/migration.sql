CREATE TABLE "bundles" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "composition_key" VARCHAR(64) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "bundles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bundles_price_check" CHECK ("price_cents" >= 0)
);
CREATE UNIQUE INDEX "bundles_composition_key_key" ON "bundles"("composition_key");
CREATE INDEX "bundles_is_active_created_at_idx" ON "bundles"("is_active", "created_at");

CREATE TABLE "bundle_items" (
  "bundle_id" TEXT NOT NULL,
  "work_id" TEXT NOT NULL,
  CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("bundle_id", "work_id")
);
CREATE INDEX "bundle_items_work_id_idx" ON "bundle_items"("work_id");
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_fkey"
  FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_work_id_fkey"
  FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "cart_bundles" (
  "id" TEXT NOT NULL,
  "cart_id" TEXT NOT NULL,
  "bundle_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cart_bundles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cart_bundles_cart_id_bundle_id_key" ON "cart_bundles"("cart_id", "bundle_id");
CREATE INDEX "cart_bundles_bundle_id_idx" ON "cart_bundles"("bundle_id");
ALTER TABLE "cart_bundles" ADD CONSTRAINT "cart_bundles_cart_id_fkey"
  FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_bundles" ADD CONSTRAINT "cart_bundles_bundle_id_fkey"
  FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "order_bundles" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "bundle_id" TEXT NOT NULL,
  "bundle_name" VARCHAR(120) NOT NULL,
  "list_price_cents" INTEGER NOT NULL,
  "ownership_adjustment_cents" INTEGER NOT NULL,
  "charged_price_cents" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_bundles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_bundles_money_check" CHECK (
    "list_price_cents" >= 0 AND "ownership_adjustment_cents" >= 0 AND
    "ownership_adjustment_cents" <= "list_price_cents" AND
    "charged_price_cents" = "list_price_cents" - "ownership_adjustment_cents"
  )
);
CREATE INDEX "order_bundles_order_id_idx" ON "order_bundles"("order_id");
CREATE INDEX "order_bundles_bundle_id_idx" ON "order_bundles"("bundle_id");
ALTER TABLE "order_bundles" ADD CONSTRAINT "order_bundles_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_bundles" ADD CONSTRAINT "order_bundles_bundle_id_fkey"
  FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD COLUMN "bundle_purchase_id" TEXT;
CREATE INDEX "order_items_bundle_purchase_id_idx" ON "order_items"("bundle_purchase_id");
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundle_purchase_id_fkey"
  FOREIGN KEY ("bundle_purchase_id") REFERENCES "order_bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
