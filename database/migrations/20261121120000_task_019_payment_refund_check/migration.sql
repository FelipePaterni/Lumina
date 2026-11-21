ALTER TABLE "payments" DROP CONSTRAINT "payments_status_amount_check";

ALTER TABLE "payments" ADD CONSTRAINT "payments_status_amount_check" CHECK (
  ("status" = 'NOT_REQUIRED' AND "amount_cents" = 0 AND "refunded_cents" = 0) OR
  ("status" = 'APPROVED' AND "amount_cents" > 0 AND "refunded_cents" = 0) OR
  ("status" = 'PARTIALLY_REFUNDED' AND "amount_cents" > 0 AND "refunded_cents" < "amount_cents") OR
  ("status" = 'REFUNDED' AND "amount_cents" > 0 AND "refunded_cents" = "amount_cents")
);
