import assert from "node:assert/strict";
import test from "node:test";
import { ObservabilityDashboardService } from "../../../apps/api/dist/modules/observability/observability-dashboard.service.js";

function createPrisma(overrides = {}) {
  return {
    $queryRaw: async () => [{ "?column?": 1 }],
    outboxEmail: {
      groupBy: async () => [
        { deliveryStatus: "PENDING", _count: { _all: 2 } },
        { deliveryStatus: "PROCESSING", _count: { _all: 1 } },
        { deliveryStatus: "RETRY", _count: { _all: 3 } },
        { deliveryStatus: "SENT", _count: { _all: 4 } },
        { deliveryStatus: "FAILED", _count: { _all: 5 } },
      ],
      count: async ({ where }) => where.deliveryStatus === "FAILED" ? 5 : 1,
    },
    user: {
      count: async ({ where }) => where.scheduledDeletionAt.gt ? 6 : 2,
      findFirst: async () => ({ scheduledDeletionAt: new Date("2026-12-01T00:00:00.000Z") }),
    },
    ...overrides,
  };
}

test("observability dashboard returns aggregate health, outbox and account deletion data", async () => {
  const service = new ObservabilityDashboardService(createPrisma());
  const result = await service.summary(new Date("2026-11-22T00:00:00.000Z"));

  assert.deepEqual(result.health, { api: "UP", database: "UP" });
  assert.deepEqual(result.notifications, {
    PENDING: 2,
    PROCESSING: 1,
    RETRY: 3,
    SENT: 4,
    FAILED: 5,
  });
  assert.deepEqual(result.accountDeletion, {
    pendingRequests: 6,
    expiredRequests: 2,
    nextScheduledDeletionAt: "2026-12-01T00:00:00.000Z",
  });
  assert.deepEqual(result.alerts, { failedNotifications: 5, expiredProcessingLeases: 1 });
  assert.doesNotMatch(JSON.stringify(result), /email|userId|targetId|reason|body/i);
});

test("observability dashboard signals database outage without pretending aggregates are zero", async () => {
  const prisma = createPrisma({ $queryRaw: async () => { throw new Error("sensitive database detail"); } });
  const service = new ObservabilityDashboardService(prisma);
  const result = await service.summary();

  assert.deepEqual(result.health, { api: "UP", database: "UNAVAILABLE" });
  assert.equal(result.notifications, null);
  assert.equal(result.accountDeletion, null);
  assert.deepEqual(result.alerts, { failedNotifications: null, expiredProcessingLeases: null });
  assert.doesNotMatch(JSON.stringify(result), /sensitive database detail/i);
});
