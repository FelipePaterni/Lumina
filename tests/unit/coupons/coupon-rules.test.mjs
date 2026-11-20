import assert from "node:assert/strict";
import test from "node:test";
import { CouponDiscountType } from "@prisma/client";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
  validateCouponAvailability,
} from "../../../apps/api/dist/modules/coupons/coupon.rules.js";

test("coupon codes are normalized and constrained", () => {
  assert.equal(normalizeCouponCode("  leitura_2026 "), "LEITURA_2026");
  assert.throws(() => normalizeCouponCode("<script>"), (error) => error.getStatus() === 400);
});

test("coupon dates and usage quota are checked before applying", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const available = { isActive: true, validFrom: new Date("2026-11-01T00:00:00Z"), validUntil: new Date("2026-12-01T00:00:00Z"), usageCount: 0, maxUses: 1 };
  assert.doesNotThrow(() => validateCouponAvailability(available, now));
  assert.throws(() => validateCouponAvailability({ ...available, usageCount: 1 }, now), (error) => error.getStatus() === 409);
  assert.throws(() => validateCouponAvailability({ ...available, validUntil: now }, now), (error) => error.getStatus() === 409);
  assert.throws(() => validateCouponAvailability({ ...available, isActive: false }, now), (error) => error.getStatus() === 409);
});

test("fixed and percentage discounts stay in integer cents and never make subtotal negative", () => {
  assert.equal(calculateCouponDiscount({ discountType: CouponDiscountType.FIXED, fixedAmountCents: 500, percentageBasisPoints: null }, 1_000), 500);
  assert.equal(calculateCouponDiscount({ discountType: CouponDiscountType.FIXED, fixedAmountCents: 1_500, percentageBasisPoints: null }, 1_000), 1_000);
  assert.equal(calculateCouponDiscount({ discountType: CouponDiscountType.PERCENTAGE, fixedAmountCents: null, percentageBasisPoints: 1_250 }, 999), 124);
});
