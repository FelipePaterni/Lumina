import assert from "node:assert/strict";
import test from "node:test";
import { assertPreorderReleased, canFulfillPreorder, preorderAvailability, PreorderReleaseError } from "../../../apps/api/dist/modules/preorders/preorder.rules.js";

test("preorders remain unavailable until the launch date and become available on that date", () => {
  const releaseAt = new Date("2026-12-01T00:00:00.000Z");
  assert.equal(preorderAvailability(releaseAt, new Date("2026-11-30T23:59:59.999Z")), "PREORDER");
  assert.equal(canFulfillPreorder(releaseAt, new Date("2026-11-30T23:59:59.999Z")), false);
  assert.throws(() => assertPreorderReleased(releaseAt, new Date("2026-11-30T23:59:59.999Z")), PreorderReleaseError);
  assert.equal(preorderAvailability(releaseAt, releaseAt), "RELEASED");
  assert.equal(canFulfillPreorder(releaseAt, releaseAt), true);
  assert.doesNotThrow(() => assertPreorderReleased(releaseAt, releaseAt));
});
