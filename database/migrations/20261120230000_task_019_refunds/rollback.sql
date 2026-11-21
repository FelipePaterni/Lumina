DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "refunds") THEN
    RAISE EXCEPTION 'Cannot rollback TASK-019 while refund records exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "orders" WHERE "status" <> 'CONFIRMED') THEN
    RAISE EXCEPTION 'Cannot rollback TASK-019 while refunded orders exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "payments" WHERE "status" IN ('PARTIALLY_REFUNDED', 'REFUNDED')) THEN
    RAISE EXCEPTION 'Cannot rollback TASK-019 while refunded payments exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "inventory_movements" WHERE "type" = 'PHYSICAL_RESTOCK') THEN
    RAISE EXCEPTION 'Cannot rollback TASK-019 while physical restock movements exist';
  END IF;
END $$;

DROP TABLE "refunds";
ALTER TABLE "payments" DROP CONSTRAINT "payments_refunded_cents_check";
ALTER TABLE "payments" DROP COLUMN "refunded_cents";
ALTER TABLE "orders" DROP COLUMN "fulfillment_status";
DROP TYPE "RefundStatus";
DROP TYPE "FulfillmentStatus";

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "OrderStatus_rollback" AS ENUM ('CONFIRMED');
ALTER TABLE "orders" ALTER COLUMN "status"
  TYPE "OrderStatus_rollback" USING ("status"::TEXT::"OrderStatus_rollback");
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_rollback" RENAME TO "OrderStatus";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"OrderStatus";

CREATE TYPE "PaymentStatus_rollback" AS ENUM ('APPROVED', 'NOT_REQUIRED');
ALTER TABLE "payments" ALTER COLUMN "status"
  TYPE "PaymentStatus_rollback" USING ("status"::TEXT::"PaymentStatus_rollback");
DROP TYPE "PaymentStatus";
ALTER TYPE "PaymentStatus_rollback" RENAME TO "PaymentStatus";

CREATE TYPE "InventoryMovementType_rollback" AS ENUM (
  'PHYSICAL_ADJUSTMENT',
  'PHYSICAL_SALE',
  'DIGITAL_ALLOCATION',
  'DIGITAL_RELEASE'
);
ALTER TABLE "inventory_movements" ALTER COLUMN "type"
  TYPE "InventoryMovementType_rollback" USING ("type"::TEXT::"InventoryMovementType_rollback");
DROP TYPE "InventoryMovementType";
ALTER TYPE "InventoryMovementType_rollback" RENAME TO "InventoryMovementType";
