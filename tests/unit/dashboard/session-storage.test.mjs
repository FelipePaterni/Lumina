import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";
import {
  loadPersistedSession,
  parsePersistedSession,
  savePersistedSession,
  WEB_SESSION_KEY,
} from "../../../apps/web/src/features/dashboard/session-storage.ts";

function tokenFor(role, exp) {
  const payload = Buffer.from(JSON.stringify({ role, exp })).toString("base64url");
  return `header.${payload}.signature`;
}

function storageWith(value) {
  const values = new Map(value === null ? [] : [[WEB_SESSION_KEY, value]]);
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, next) => values.set(key, next),
    removeItem: (key) => values.delete(key),
  };
}

test("session reload restores an unexpired customer or staff token", () => {
  const token = tokenFor("CUSTOMER", 200);
  const raw = JSON.stringify({ token, role: "CUSTOMER" });
  assert.deepEqual(parsePersistedSession(raw, 100_000), { token, role: "CUSTOMER" });
  const storage = storageWith(null);
  savePersistedSession(storage, { token, role: "CUSTOMER" });
  assert.deepEqual(loadPersistedSession(storage, 100_000), { token, role: "CUSTOMER" });
});

test("expired, malformed, and role-mismatched sessions are discarded", () => {
  assert.equal(parsePersistedSession(JSON.stringify({ token: tokenFor("CUSTOMER", 99), role: "CUSTOMER" }), 100_000), null);
  assert.equal(parsePersistedSession(JSON.stringify({ token: "bad.token", role: "ADMIN" }), 0), null);
  assert.equal(parsePersistedSession(JSON.stringify({ token: tokenFor("CUSTOMER", 200), role: "ADMIN" }), 0), null);
  const storage = storageWith(JSON.stringify({ token: tokenFor("CUSTOMER", 99), role: "CUSTOMER" }));
  assert.equal(loadPersistedSession(storage, 100_000), null);
  assert.equal(storage.getItem(WEB_SESSION_KEY), null);
});

test("clearing the web session removes its persisted value", () => {
  const storage = storageWith(JSON.stringify({ token: tokenFor("ADMIN", 200), role: "ADMIN" }));
  savePersistedSession(storage, null);
  assert.equal(storage.getItem(WEB_SESSION_KEY), null);
});
