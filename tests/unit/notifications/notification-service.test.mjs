import assert from "node:assert/strict";
import test from "node:test";
import { NotificationEventType } from "../../../apps/api/dist/modules/notifications/notification-event.js";
import { NotificationService } from "../../../apps/api/dist/modules/notifications/notification.service.js";

class MockOutboxPrisma {
  rows = new Map();

  outboxEmail = {
    upsert: async ({ where, create }) => {
      const existing = [...this.rows.values()].find((row) => row.eventKey === where.eventKey);
      if (existing) return existing;
      const row = { id: `event-${this.rows.size + 1}`, ...create, attemptCount: 0, sentAt: null, nextAttemptAt: null };
      this.rows.set(row.id, row);
      return row;
    },
    findMany: async ({ where }) => {
      const now = where.OR.find((entry) => entry.deliveryStatus === "RETRY")?.nextAttemptAt?.lte ?? new Date();
      return [...this.rows.values()].filter((row) =>
        row.deliveryStatus === "PENDING" ||
        ((row.deliveryStatus === "RETRY" || row.deliveryStatus === "PROCESSING") && row.nextAttemptAt <= now),
      );
    },
    updateMany: async ({ where, data }) => {
      const row = this.rows.get(where.id);
      if (!row || row.deliveryStatus !== where.deliveryStatus || row.attemptCount !== where.attemptCount) return { count: 0 };
      if (where.nextAttemptAt && row.nextAttemptAt > where.nextAttemptAt.lte) return { count: 0 };
      const { attemptCount, ...fields } = data;
      Object.assign(row, fields);
      if (typeof attemptCount === "object") row.attemptCount += attemptCount.increment;
      return { count: 1 };
    },
    update: async ({ where, data }) => {
      const row = this.rows.get(where.id);
      Object.assign(row, data);
      return row;
    },
  };
}

class MockTransport {
  calls = [];
  failuresRemaining;

  constructor(failuresRemaining = 0) {
    this.failuresRemaining = failuresRemaining;
  }

  async deliver(message) {
    this.calls.push(message);
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new Error("private adapter failure detail must not be persisted");
    }
  }
}

function createMessage(eventKey = "order:synthetic-order:confirmed") {
  return {
    eventKey,
    eventType: NotificationEventType.ORDER_CONFIRMED,
    toEmail: "customer@example.invalid",
    subject: "Pedido confirmado",
    body: "Pedido sintético confirmado.",
  };
}

test("notification event key deduplicates successful simulated delivery", async () => {
  const prisma = new MockOutboxPrisma();
  const transport = new MockTransport();
  const service = new NotificationService(prisma, transport);

  await Promise.all([
    service.dispatchSimulatedEmail(createMessage()),
    service.dispatchSimulatedEmail(createMessage()),
  ]);

  assert.equal(prisma.rows.size, 1);
  assert.equal(transport.calls.length, 1);
  assert.equal([...prisma.rows.values()][0].deliveryStatus, "SENT");
  assert.equal([...prisma.rows.values()][0].attemptCount, 1);
});

test("notification retries transient simulated delivery failures and records no raw error", async () => {
  const prisma = new MockOutboxPrisma();
  const transport = new MockTransport(1);
  const service = new NotificationService(prisma, transport);

  await service.dispatchSimulatedEmail(createMessage("identity:synthetic-user:reset:one"));
  const event = [...prisma.rows.values()][0];
  assert.equal(event.deliveryStatus, "RETRY");
  assert.equal(event.attemptCount, 1);
  assert.equal(event.lastErrorCode, "SIMULATED_DELIVERY_FAILED");
  assert.equal(JSON.stringify(event).includes("private adapter failure detail"), false);

  await service.processPending(new Date(event.nextAttemptAt.getTime() + 1));
  assert.equal(event.deliveryStatus, "SENT");
  assert.equal(event.attemptCount, 2);
  assert.equal(transport.calls.length, 2);
});

test("notification enqueue failure does not reject the source operation", async () => {
  const prisma = new MockOutboxPrisma();
  prisma.outboxEmail.upsert = async () => { throw new Error("database detail"); };
  const service = new NotificationService(prisma, new MockTransport());

  await assert.doesNotReject(() => service.dispatchSimulatedEmail(createMessage()));
  assert.equal(prisma.rows.size, 0);
});

test("notification stops after the configured retry limit", async () => {
  const prisma = new MockOutboxPrisma();
  const transport = new MockTransport(5);
  const service = new NotificationService(prisma, transport);

  await service.dispatchSimulatedEmail(createMessage("identity:synthetic-user:reset:terminal"));
  const event = [...prisma.rows.values()][0];
  for (let attempt = 1; attempt < 3; attempt += 1) {
    await service.processPending(new Date(event.nextAttemptAt.getTime() + 1));
  }

  assert.equal(event.deliveryStatus, "FAILED");
  assert.equal(event.attemptCount, 3);
  assert.equal(event.nextAttemptAt, null);
  assert.equal(transport.calls.length, 3);
});
