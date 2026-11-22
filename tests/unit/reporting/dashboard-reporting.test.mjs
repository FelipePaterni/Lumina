import assert from "node:assert/strict";
import test from "node:test";
import { AdminDashboardService } from "../../../apps/api/dist/modules/reporting/admin-dashboard.service.js";
import { CatalogDashboardService } from "../../../apps/api/dist/modules/reporting/catalog-dashboard.service.js";

test("admin dashboard aggregates net paid sales, active customers, orders, and top works", async () => {
  const prisma = {
    payment: {
      aggregate: async () => ({ _sum: { amountCents: 12500, refundedCents: 2500 } }),
    },
    user: { count: async () => 7 },
    order: { count: async () => 9 },
    $queryRaw: async () => [
      { workId: "work-a", workTitle: "A", netUnits: 5n },
      { workId: "work-b", workTitle: "B", netUnits: 2n },
    ],
  };

  const result = await new AdminDashboardService(prisma).summary();

  assert.deepEqual(result, {
    netSalesCents: 10000,
    activeCustomers: 7,
    confirmedOrders: 9,
    bestsellers: [
      { workId: "work-a", workTitle: "A", netUnits: 5 },
      { workId: "work-b", workTitle: "B", netUnits: 2 },
    ],
  });
});

test("admin dashboard returns zero metrics when there is no data", async () => {
  const prisma = {
    payment: { aggregate: async () => ({ _sum: { amountCents: null, refundedCents: null } }) },
    user: { count: async () => 0 },
    order: { count: async () => 0 },
    $queryRaw: async () => [],
  };

  assert.deepEqual(await new AdminDashboardService(prisma).summary(), {
    netSalesCents: 0,
    activeCustomers: 0,
    confirmedOrders: 0,
    bestsellers: [],
  });
});

test("catalog dashboard separates finite and unlimited licenses and counts currently usable coupons", async () => {
  const now = new Date("2026-11-22T12:00:00.000Z");
  let couponQuery;
  const prisma = {
    edition: {
      findMany: async () => [
        { id: "finite-available", work: { title: "Available" }, inventory: { digitalLicenseLimit: 10, digitalAllocated: 4 } },
        { id: "finite-exhausted", work: { title: "Exhausted" }, inventory: { digitalLicenseLimit: 2, digitalAllocated: 2 } },
        { id: "unlimited", work: { title: "Unlimited" }, inventory: { digitalLicenseLimit: null, digitalAllocated: 7 } },
        { id: "unconfigured", work: { title: "Unconfigured" }, inventory: null },
      ],
    },
    coupon: {
      findMany: async (query) => {
        couponQuery = query;
        return [
          { usageCount: 3, maxUses: 10 },
          { usageCount: 8, maxUses: 10 },
          { usageCount: 10, maxUses: 10 },
        ];
      },
    },
  };

  const result = await new CatalogDashboardService(prisma).summary(now);

  assert.deepEqual(result, {
    licenses: {
      digitalEditionCount: 4,
      allocated: 13,
      finiteLimit: 12,
      finiteAllocated: 6,
      finiteAvailable: 6,
      unlimitedEditionCount: 2,
      exhausted: [{ editionId: "finite-exhausted", workTitle: "Exhausted", allocated: 2, limit: 2 }],
    },
    coupons: { availableCount: 2, usageCount: 11, quota: 20, remainingUses: 9 },
  });
  assert.deepEqual(couponQuery.where, {
    isActive: true,
    validFrom: { lte: now },
    validUntil: { gt: now },
  });
});

test("catalog dashboard returns empty summaries without editions or usable coupons", async () => {
  const prisma = {
    edition: { findMany: async () => [] },
    coupon: { findMany: async () => [] },
  };

  assert.deepEqual(await new CatalogDashboardService(prisma).summary(), {
    licenses: {
      digitalEditionCount: 0,
      allocated: 0,
      finiteLimit: 0,
      finiteAllocated: 0,
      finiteAvailable: 0,
      unlimitedEditionCount: 0,
      exhausted: [],
    },
    coupons: { availableCount: 0, usageCount: 0, quota: 0, remainingUses: 0 },
  });
});
