DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "payments"
    WHERE "status" IN ('PARTIALLY_REFUNDED', 'REFUNDED') OR "refunded_cents" > 0
  ) THEN
    RAISE EXCEPTION 'Cannot rollback refund payment constraint while refunded payments exist';
  END IF;
END $$;

ALTER TABLE "payments" DROP CONSTRAINT "payments_status_amount_check";
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_amount_check" CHECK (
  ("status" = 'NOT_REQUIRED' AND "amount_cents" = 0) OR
  ("status" = 'APPROVED' AND "amount_cents" > 0)
);
