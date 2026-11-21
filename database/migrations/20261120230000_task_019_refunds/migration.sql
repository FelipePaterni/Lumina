ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "InventoryMovementType" ADD VALUE 'PHYSICAL_RESTOCK';

CREATE TYPE "FulfillmentStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'PICKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE "RefundStatus" AS ENUM (
  'PENDING_REVIEW',
  'AWAITING_RETURN',
  'REJECTED',
  'PROCESSED'
);

ALTER TABLE "orders"
  ADD COLUMN "fulfillment_status" "FulfillmentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

UPDATE "orders" AS o
SET "fulfillment_status" = 'PENDING'
WHERE EXISTS (
  SELECT 1 FROM "order_items" AS oi
  WHERE oi."order_id" = o."id" AND oi."format" = 'PHYSICAL'
);

ALTER TABLE "payments"
  ADD COLUMN "refunded_cents" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "payments_refunded_cents_check"
    CHECK ("refunded_cents" >= 0 AND "refunded_cents" <= "amount_cents");

CREATE TABLE "refunds" (
  "id" TEXT NOT NULL,
  "order_item_id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "decider_id" TEXT,
  "idempotency_key" VARCHAR(128) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "quantity" INTEGER NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "request_reason" VARCHAR(500) NOT NULL,
  "decision_reason" VARCHAR(500),
  "return_confirmed_at" TIMESTAMPTZ(6),
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decided_at" TIMESTAMPTZ(6),
  "processed_at" TIMESTAMPTZ(6),
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refunds_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "refunds_amount_cents_check" CHECK ("amount_cents" >= 0)
);

CREATE UNIQUE INDEX "refunds_requester_id_idempotency_key_key"
  ON "refunds"("requester_id", "idempotency_key");
CREATE INDEX "refunds_order_item_id_status_requested_at_idx"
  ON "refunds"("order_item_id", "status", "requested_at");
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_item_id_fkey"
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_decider_id_fkey"
  FOREIGN KEY ("decider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
