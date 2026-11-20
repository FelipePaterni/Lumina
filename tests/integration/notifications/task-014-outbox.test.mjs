import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { NotificationEventType } from "../../../apps/api/dist/modules/notifications/notification-event.js";
import { NotificationService } from "../../../apps/api/dist/modules/notifications/notification.service.js";
import { SimulatedEmailTransport } from "../../../apps/api/dist/modules/notifications/simulated-email-transport.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function deployMigrations(databaseUrl) {
  execSync("npm run db:migrate", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

test("TASK-014 notification outbox migration is repeatable and event delivery is idempotent", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const suffix = randomUUID();
  const eventKey = `task014:integration:${suffix}`;
  const notificationService = new NotificationService(prisma, new SimulatedEmailTransport());

  try {
    await prisma.$connect();
    const migration = await prisma.$queryRaw`
      SELECT finished_at FROM "_prisma_migrations"
      WHERE migration_name = '20261120180000_task_014_notifications'
        AND rolled_back_at IS NULL
    `;
    assert.equal(migration.length, 1);

    const columns = await prisma.$queryRaw`
      SELECT count(*)::int AS total
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'outbox_emails'
        AND column_name IN ('event_key', 'event_type', 'delivery_status', 'attempt_count', 'last_attempt_at', 'next_attempt_at', 'last_error_code')
    `;
    assert.equal(columns[0].total, 7);

    const notification = {
      eventKey,
      eventType: NotificationEventType.ORDER_CONFIRMED,
      toEmail: `task014-${suffix}@example.invalid`,
      subject: "Confirmação sintética TASK-014",
      body: "Mensagem sintética de integração.",
    };
    await notificationService.dispatchSimulatedEmail(notification);
    await notificationService.dispatchSimulatedEmail(notification);

    const rows = await prisma.outboxEmail.findMany({ where: { eventKey } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].deliveryStatus, "SENT");
    assert.equal(rows[0].attemptCount, 1);
    assert.ok(rows[0].sentAt);
  } finally {
    await prisma.outboxEmail.deleteMany({ where: { eventKey } });
    await prisma.$disconnect();
  }
});
