import test from "node:test";
import assert from "node:assert/strict";

const validIsbn = (value) => {
  if (!value) return true;
  const isbn = value.replace(/[-\s]/g, "").toUpperCase();
  if (isbn.length === 10) return [...isbn].reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0) % 11 === 0;
  if (isbn.length === 13) return [...isbn].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
  return false;
};

test("catalog ISBN validation accepts ISBN-10 and ISBN-13 and rejects malformed values", () => {
  assert.equal(validIsbn("0-306-40615-2"), true);
  assert.equal(validIsbn("978-0-306-40615-7"), true);
  assert.equal(validIsbn("978-0-306-40615-8"), false);
  assert.equal(validIsbn("not-an-isbn"), false);
});
