import assert from "node:assert/strict";
import process from "node:process";
import { PrismaClient } from "@prisma/client";
import { getTaskDatabaseUrl, loadLocalEnvironment } from "./manual-environment.mjs";

loadLocalEnvironment();
const databaseUrl = getTaskDatabaseUrl();
const orderId = process.argv[2];
assert.ok(orderId, "Informe um pedido sintético.");
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
