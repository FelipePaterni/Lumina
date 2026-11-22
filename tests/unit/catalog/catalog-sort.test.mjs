import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogSortOptions,
  isCatalogSort,
} from "../../../apps/api/src/modules/catalog/search/catalog-sort.ts";

test("catalog sort accepts only supported ranking values", () => {
  assert.deepEqual(catalogSortOptions, ["BEST_SELLING", "TOP_RATED"]);
  assert.equal(isCatalogSort("BEST_SELLING"), true);
  assert.equal(isCatalogSort("TOP_RATED"), true);
  assert.equal(isCatalogSort("LATEST"), false);
  assert.equal(isCatalogSort(""), false);
});
