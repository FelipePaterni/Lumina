CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED');
CREATE TYPE "PaymentMethod" AS ENUM ('SIMULATED');
CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED', 'NOT_REQUIRED');
ALTER TYPE "InventoryMovementType" ADD VALUE 'PHYSICAL_SALE';

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "idempotency_key" VARCHAR(128) NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
  "subtotal_cents" INTEGER NOT NULL,
  "discount_cents" INTEGER NOT NULL DEFAULT 0,
  "shipping_cents" INTEGER NOT NULL DEFAULT 0,
  "total_cents" INTEGER NOT NULL,
  "coupon_code" VARCHAR(40),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_money_check" CHECK (
    "subtotal_cents" >= 0 AND "discount_cents" >= 0 AND
    "discount_cents" <= "subtotal_cents" AND "shipping_cents" >= 0 AND
    "total_cents" = "subtotal_cents" - "discount_cents" + "shipping_cents"
  )
);
CREATE UNIQUE INDEX "orders_user_id_idempotency_key_key" ON "orders"("user_id", "idempotency_key");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "order_items" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "work_title" TEXT NOT NULL,
  "format" "EditionFormat" NOT NULL,
  "unit_price_cents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_price_check" CHECK ("unit_price_cents" >= 0),
  CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0)
);
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_edition_id_idx" ON "order_items"("edition_id");
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_edition_id_fkey"
  FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "shipping_addresses" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "recipient_name" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "postal_code" VARCHAR(8) NOT NULL,
  "street" VARCHAR(160) NOT NULL,
  "number" VARCHAR(20) NOT NULL,
  "complement" VARCHAR(120),
  "district" VARCHAR(100) NOT NULL,
  "city" VARCHAR(100) NOT NULL,
  "state" CHAR(2) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipping_addresses_postal_code_check" CHECK ("postal_code" ~ '^[0-9]{8}$'),
  CONSTRAINT "shipping_addresses_state_check" CHECK ("state" ~ '^[A-Z]{2}$')
);
CREATE UNIQUE INDEX "shipping_addresses_order_id_key" ON "shipping_addresses"("order_id");
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'SIMULATED',
  "status" "PaymentStatus" NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_amount_check" CHECK ("amount_cents" >= 0),
  CONSTRAINT "payments_status_amount_check" CHECK (
    ("status" = 'NOT_REQUIRED' AND "amount_cents" = 0) OR
    ("status" = 'APPROVED' AND "amount_cents" > 0)
  )
);
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
