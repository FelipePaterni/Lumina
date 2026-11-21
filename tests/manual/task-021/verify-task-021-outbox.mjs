import assert from "node:assert/strict";
import process from "node:process";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TASK009_TEST_DATABASE_URL;
const orderId = process.argv[2];
assert.ok(databaseUrl && orderId, "Informe TASK009_TEST_DATABASE_URL e um pedido sintético.");
const parsedUrl = new URL(databaseUrl);
assert.equal(decodeURIComponent(parsedUrl.pathname.slice(1)), "lumina_task009_test", "A verificação só consulta a base isolada lumina_task009_test.");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
try {
  const rows = await prisma.outboxEmail.findMany({
    where: { eventKey: { startsWith: `order:${orderId}:fulfillment:` } },
    select: { eventKey: true, eventType: true, deliveryStatus: true },
  });
  const statuses = new Set(rows.map((row) => row.eventKey.split(":").at(-1)));
  const valid = ["PICKING", "SHIPPED", "DELIVERED"].every((status) => statuses.has(status)) &&
    rows.every((row) => row.eventType === "ORDER_FULFILLMENT_UPDATED" && row.deliveryStatus === "SENT") && rows.length === 3;
  if (!valid) process.exitCode = 1;
  process.stdout.write(`${JSON.stringify({ valid, count: rows.length, statuses: [...statuses].sort() })}\n`);
} finally {
  await prisma.$disconnect();
}
