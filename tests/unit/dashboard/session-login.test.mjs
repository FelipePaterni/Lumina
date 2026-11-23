import test from "node:test";
import assert from "node:assert/strict";
import { sessionsForLogin } from "../../../apps/web/src/features/dashboard/session-login.ts";

test("customer login clears a previously active staff session", () => {
  assert.deepEqual(sessionsForLogin("customer-token", "CUSTOMER"), {
    customerToken: "customer-token",
    staffSession: null,
  });
});

test("staff login clears a previously active customer session", () => {
  assert.deepEqual(sessionsForLogin("staff-token", "ADMIN"), {
    customerToken: null,
    staffSession: { token: "staff-token", role: "ADMIN" },
  });
});
