import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateBundlePrice,
  BundleRuleError,
  calculateBundlePrice,
  compositionKey,
  normalizeComposition,
} from "../../../apps/api/dist/modules/bundles/bundle.rules.js";

const workA = "00000000-0000-4000-8000-000000000001";
const workB = "00000000-0000-4000-8000-000000000002";

test("bundle composition is canonical and rejects duplicates or invalid identifiers", () => {
  assert.deepEqual(normalizeComposition([workB, workA]), [workA, workB]);
  assert.equal(compositionKey([workA, workB]), compositionKey([workB, workA]));
  assert.throws(() => normalizeComposition([workA, workA]), BundleRuleError);
  assert.throws(() => normalizeComposition([workA]), BundleRuleError);
  assert.throws(() => normalizeComposition([workA, "invalid"]), BundleRuleError);
});

test("owned ebook value reduces bundle price and the result never goes below zero", () => {
  const quote = calculateBundlePrice(2_000, [
    { editionId: workA, currentPriceCents: 1_500, owned: true },
    { editionId: workB, currentPriceCents: 1_200, owned: false },
  ]);
  assert.equal(quote.ownershipAdjustmentCents, 1_500);
  assert.equal(quote.chargedPriceCents, 500);
  assert.deepEqual(quote.itemsToGrant.map((item) => item.editionId), [workB]);

  const zeroQuote = calculateBundlePrice(1_000, [
    { editionId: workA, currentPriceCents: 1_500, owned: true },
    { editionId: workB, currentPriceCents: 1_200, owned: false },
  ]);
  assert.equal(zeroQuote.chargedPriceCents, 0);
  assert.equal(zeroQuote.ownershipAdjustmentCents, 1_000);
});

test("bundle with every ebook already owned is rejected", () => {
  assert.throws(() => calculateBundlePrice(2_000, [
    { editionId: workA, currentPriceCents: 1_500, owned: true },
    { editionId: workB, currentPriceCents: 1_200, owned: true },
  ]), (error) => error instanceof BundleRuleError && error.code === "ALL_ITEMS_OWNED");
});

test("bundle price allocation preserves the exact total in integer cents", () => {
  assert.deepEqual(allocateBundlePrice(1_001, 3), [334, 334, 333]);
  assert.deepEqual(allocateBundlePrice(0, 2), [0, 0]);
});
