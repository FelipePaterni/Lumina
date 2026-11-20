import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { sumOrderTotals, validateIdempotencyKey } from "../../../apps/api/dist/modules/orders/order.rules.js";
import { SimulatedPaymentService } from "../../../apps/api/dist/modules/payments/simulated-payment.service.js";

test("Idempotency-Key accepts opaque bounded values and rejects malformed input", () => {
  assert.equal(validateIdempotencyKey("task013-request-001"), "task013-request-001");
  for (const value of [undefined, "short", "contains space", "éééééééé", "x".repeat(129)]) {
    assert.throws(() => validateIdempotencyKey(value), BadRequestException);
  }
});

test("order totals use integer cents and reject invalid or overflowing amounts", () => {
  assert.equal(sumOrderTotals(10_000, 2_500, 900), 8_400);
  assert.equal(sumOrderTotals(0, 0, 0), 0);
  assert.throws(() => sumOrderTotals(100, 101, 0), BadRequestException);
  assert.throws(() => sumOrderTotals(Number.MAX_SAFE_INTEGER, 0, 1), BadRequestException);
});

test("simulated payment skips zero value and approves positive value", () => {
  const payments = new SimulatedPaymentService();
  assert.deepEqual(payments.confirm(0), { status: "NOT_REQUIRED", amountCents: 0 });
  assert.deepEqual(payments.confirm(1), { status: "APPROVED", amountCents: 1 });
  assert.throws(() => payments.confirm(-1), BadRequestException);
});
