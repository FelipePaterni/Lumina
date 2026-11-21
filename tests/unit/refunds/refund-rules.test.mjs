import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import {
  allocateOrderDiscount,
  calculateRefundAmountCents,
  canAutomaticallyRefundDigital,
  canCancelPreorder,
  refundWindowMs,
  validateRefundReason,
} from "../../../apps/api/dist/modules/refunds/refund.rules.js";

test("digital refund windows cover two hours after first link and two weeks without a download", () => {
  const purchasedAt = new Date("2026-11-01T12:00:00.000Z");
  assert.equal(
    canAutomaticallyRefundDigital({
      purchasedAt,
      firstLinkIssuedAt: null,
      downloadedAt: null,
      now: new Date(purchasedAt.getTime() + refundWindowMs.twoWeeks),
    }),
    true,
  );
  assert.equal(
    canAutomaticallyRefundDigital({
      purchasedAt,
      firstLinkIssuedAt: null,
      downloadedAt: null,
      now: new Date(purchasedAt.getTime() + refundWindowMs.twoWeeks + 1),
    }),
    false,
  );
  const linkAt = new Date("2026-11-10T12:00:00.000Z");
  assert.equal(
    canAutomaticallyRefundDigital({
      purchasedAt,
      firstLinkIssuedAt: linkAt,
      downloadedAt: new Date(linkAt.getTime() + 1_000),
      now: new Date(linkAt.getTime() + refundWindowMs.twoHours),
    }),
    true,
  );
  assert.equal(
    canAutomaticallyRefundDigital({
      purchasedAt,
      firstLinkIssuedAt: linkAt,
      downloadedAt: new Date(linkAt.getTime() + 1_000),
      now: new Date(linkAt.getTime() + refundWindowMs.twoHours + 1),
    }),
    false,
  );
});

test("preorder cancellation closes exactly one week before release", () => {
  const releaseAt = new Date("2026-12-01T12:00:00.000Z");
  const deadline = new Date(releaseAt.getTime() - refundWindowMs.oneWeek);
  assert.equal(canCancelPreorder(releaseAt, deadline), true);
  assert.equal(
    canCancelPreorder(releaseAt, new Date(deadline.getTime() + 1)),
    false,
  );
});

test("coupon cents are allocated proportionally and deterministically across order lines", () => {
  const lines = [
    { id: "line-b", unitPriceCents: 1_000, quantity: 1 },
    { id: "line-a", unitPriceCents: 1_000, quantity: 1 },
    { id: "line-c", unitPriceCents: 2_000, quantity: 1 },
  ];
  const allocation = allocateOrderDiscount(lines, 101);
  assert.equal(allocation.get("line-a"), 25);
  assert.equal(allocation.get("line-b"), 25);
  assert.equal(allocation.get("line-c"), 51);
  assert.equal(
    [...allocation.values()].reduce((sum, cents) => sum + cents, 0),
    101,
  );
  assert.equal(
    calculateRefundAmountCents(lines[2], allocation.get("line-c")),
    1_949,
  );
});

test("coupon allocation rejects unsafe or inconsistent order amounts", () => {
  assert.throws(
    () =>
      allocateOrderDiscount(
        [{ id: "line", unitPriceCents: 100, quantity: 1 }],
        101,
      ),
    BadRequestException,
  );
  assert.throws(
    () =>
      allocateOrderDiscount(
        [{ id: "line", unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 2 }],
        0,
      ),
    BadRequestException,
  );
  assert.throws(
    () =>
      calculateRefundAmountCents(
        { id: "line", unitPriceCents: 10, quantity: 1 },
        11,
      ),
    BadRequestException,
  );
});

test("refund reason is bounded and rejects control characters", () => {
  assert.equal(validateRefundReason("Motivo sintético"), "Motivo sintético");
  for (const reason of [
    undefined,
    "no",
    "reason\nwith control",
    "x".repeat(501),
  ]) {
    assert.throws(() => validateRefundReason(reason), BadRequestException);
  }
});
