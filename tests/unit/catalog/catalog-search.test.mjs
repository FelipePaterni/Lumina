import assert from "node:assert/strict";
import test from "node:test";

const normalizeSearchQuery = (query) => ({ ...query, page: Number.isInteger(query.page) && query.page > 0 ? query.page : 1, limit: Number.isInteger(query.limit) && query.limit > 0 ? Math.min(query.limit, 50) : 12 });

test("catalog search defaults and caps pagination", () => {
  assert.deepEqual(normalizeSearchQuery({}), { page: 1, limit: 12 });
  assert.deepEqual(normalizeSearchQuery({ page: 2, limit: 100 }), { page: 2, limit: 50 });
  assert.deepEqual(normalizeSearchQuery({ page: 0, limit: 0 }), { page: 1, limit: 12 });
});
