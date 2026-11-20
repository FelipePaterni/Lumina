CREATE TYPE "CouponDiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

CREATE TABLE "carts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "coupon_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
CREATE INDEX "carts_coupon_id_idx" ON "carts"("coupon_id");

CREATE TABLE "cart_items" (
  "id" TEXT NOT NULL,
  "cart_id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cart_items_quantity_check" CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX "cart_items_cart_id_edition_id_key" ON "cart_items"("cart_id", "edition_id");
CREATE INDEX "cart_items_edition_id_idx" ON "cart_items"("edition_id");

CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "discount_type" "CouponDiscountType" NOT NULL,
  "fixed_amount_cents" INTEGER,
  "percentage_basis_points" INTEGER,
  "valid_from" TIMESTAMPTZ(6) NOT NULL,
  "valid_until" TIMESTAMPTZ(6) NOT NULL,
  "max_uses" INTEGER NOT NULL,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupons_dates_check" CHECK ("valid_until" > "valid_from"),
  CONSTRAINT "coupons_usage_check" CHECK ("max_uses" > 0 AND "usage_count" >= 0 AND "usage_count" <= "max_uses"),
  CONSTRAINT "coupons_discount_check" CHECK (
    ("discount_type" = 'FIXED' AND "fixed_amount_cents" > 0 AND "percentage_basis_points" IS NULL) OR
    ("discount_type" = 'PERCENTAGE' AND "percentage_basis_points" BETWEEN 1 AND 10000 AND "fixed_amount_cents" IS NULL)
  )
);
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_is_active_valid_from_valid_until_idx" ON "coupons"("is_active", "valid_from", "valid_until");

CREATE TABLE "shipping_rules" (
  "id" TEXT NOT NULL,
  "postal_code_start" VARCHAR(8) NOT NULL,
  "postal_code_end" VARCHAR(8) NOT NULL,
  "min_physical_quantity" INTEGER NOT NULL,
  "max_physical_quantity" INTEGER,
  "price_cents" INTEGER NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipping_rules_postal_digits_check" CHECK (
    "postal_code_start" ~ '^[0-9]{8}$' AND "postal_code_end" ~ '^[0-9]{8}$' AND "postal_code_start" <= "postal_code_end"
  ),
  CONSTRAINT "shipping_rules_quantity_check" CHECK (
    "min_physical_quantity" > 0 AND ("max_physical_quantity" IS NULL OR "max_physical_quantity" >= "min_physical_quantity")
  ),
  CONSTRAINT "shipping_rules_price_check" CHECK ("price_cents" > 0)
);
CREATE INDEX "shipping_rules_is_active_priority_idx" ON "shipping_rules"("is_active", "priority");

CREATE TABLE "library_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "library_items_user_id_edition_id_key" ON "library_items"("user_id", "edition_id");
CREATE INDEX "library_items_edition_id_idx" ON "library_items"("edition_id");

ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_coupon_id_fkey"
  FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey"
  FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_edition_id_fkey"
  FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_edition_id_fkey"
  FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
