import assert from "node:assert/strict";
import test from "node:test";
import { LogisticsService } from "../../../apps/api/dist/modules/logistics/logistics.service.js";
import { validateTrackingCode, validateTransition } from "../../../apps/api/dist/modules/logistics/logistics.rules.js";
import { FulfillmentStatus } from "@prisma/client";

function createHarness({ releaseDate = new Date("2020-01-01T00:00:00.000Z") } = {}) {
  const now = new Date();
  const order = {
    id: "order-synthetic",
    userId: "customer-synthetic",
    status: "CONFIRMED",
    fulfillmentStatus: FulfillmentStatus.PENDING,
    user: { email: "synthetic@example.test" },
    items: [{
      id: "item-synthetic",
      format: "PHYSICAL",
      refunds: [],
      edition: { work: { releaseDate } },
    }],
  };
  const auditRows = [];
  const notifications = [];
  const prisma = {
    $transaction: async (work) => work({
      order: {
        findUnique: async () => ({ ...order, items: order.items }),
        updateMany: async ({ where, data }) => {
          if (order.fulfillmentStatus !== where.fulfillmentStatus) return { count: 0 };
          order.fulfillmentStatus = data.fulfillmentStatus;
          return { count: 1 };
        },
      },
      auditLog: {
        create: async ({ data }) => { auditRows.push({ ...data, createdAt: now }); },
      },
    }),
    order: {
      findFirst: async ({ where }) => where.userId === order.userId
        ? { id: order.id, fulfillmentStatus: order.fulfillmentStatus }
        : null,
    },
    auditLog: {
      findMany: async ({ where }) => auditRows
        .filter((row) => row.targetType === where.targetType && row.targetId === where.targetId && row.action === where.action)
        .sort((left, right) => right.createdAt - left.createdAt),
    },
  };
  const audit = { logActionInTransaction: async (_tx, params) => {
    auditRows.push({ ...params, metadata: JSON.stringify(params.metadata), createdAt: now });
  } };
  const notificationService = { dispatchSimulatedEmail: async (event) => notifications.push(event) };
  return {
    service: new LogisticsService(prisma, audit, notificationService),
    order,
    auditRows,
    notifications,
  };
}

test("fulfillment transitions are sequential and shipment records tracking and notifies once per status", async () => {
  const { service, order, auditRows, notifications } = createHarness();

  await service.transition(order.id, "PICKING", undefined, "stock-synthetic", "STOCK");
  const shipped = await service.transition(order.id, "SHIPPED", "  SYN-TRACK-001  ", "stock-synthetic", "STOCK");
  await service.transition(order.id, "DELIVERED", undefined, "stock-synthetic", "STOCK");

  assert.equal(order.fulfillmentStatus, FulfillmentStatus.DELIVERED);
  assert.equal(shipped.trackingCode, "SYN-TRACK-001");
  assert.deepEqual(auditRows.map((row) => JSON.parse(row.metadata).toStatus), ["PICKING", "SHIPPED", "DELIVERED"]);
  assert.equal(notifications.length, 3);
  assert.ok(notifications.every((event) => event.eventType === "ORDER_FULFILLMENT_UPDATED"));
  assert.equal(notifications[1].eventKey, "order:order-synthetic:fulfillment:SHIPPED");
});

test("invalid fulfillment transition has no audit or notification side effect", async () => {
  const { service, order, auditRows, notifications } = createHarness();

  await assert.rejects(
    service.transition(order.id, "SHIPPED", "SYN-TRACK-001", "stock-synthetic", "STOCK"),
    (error) => error.getStatus() === 409,
  );

  assert.equal(order.fulfillmentStatus, FulfillmentStatus.PENDING);
  assert.equal(auditRows.length, 0);
  assert.equal(notifications.length, 0);
});

test("physical preorder cannot be shipped before launch", async () => {
  const { service, order, auditRows, notifications } = createHarness({ releaseDate: new Date(Date.now() + 86_400_000) });
  await service.transition(order.id, "PICKING", undefined, "stock-synthetic", "STOCK");

  await assert.rejects(
    service.transition(order.id, "SHIPPED", "SYN-TRACK-001", "stock-synthetic", "STOCK"),
    (error) => error.getStatus() === 409 && /lançamento/.test(error.message),
  );

  assert.equal(order.fulfillmentStatus, FulfillmentStatus.PICKING);
  assert.equal(auditRows.length, 1);
  assert.equal(notifications.length, 1);
});

test("customer tracking is restricted to the order owner", async () => {
  const { service, order } = createHarness();
  await assert.rejects(
    service.getForCustomer(order.id, "another-customer"),
    (error) => error.getStatus() === 404,
  );
});

test("tracking codes and transitions reject invalid input", () => {
  assert.equal(validateTrackingCode("TRACK-1", true), "TRACK-1");
  assert.throws(() => validateTrackingCode("", true), (error) => error.getStatus() === 400);
  assert.throws(() => validateTrackingCode("TRACK\nINJECT", true), (error) => error.getStatus() === 400);
  assert.throws(
    () => validateTransition(FulfillmentStatus.PENDING, FulfillmentStatus.SHIPPED),
    (error) => error.getStatus() === 409,
  );
});
