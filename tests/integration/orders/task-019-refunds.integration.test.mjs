import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { RefundService } from "../../../apps/api/dist/modules/refunds/refund.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function deployMigrations(databaseUrl) {
  execSync("npm run db:migrate", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

test("TASK-019 automatically refunds eligible digital orders and restores license once", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const app = await NestFactory.create(AppModule, { logger: false });
  let userId;
  let workId;
  let orderId;
  let authorId;
  let publisherId;
  let refundService;

  try {
    await prisma.$connect();
    await app.init();
    refundService = app.get(RefundService);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const user = await prisma.user.create({
      data: {
        email: `task019-customer-${suffix}@lumina.local`,
        passwordHash: "synthetic-only",
        role: "CUSTOMER",
        isEmailConfirmed: true,
      },
    });
    userId = user.id;
    const author = await prisma.author.create({
      data: { name: `TASK019 Author ${suffix}` },
    });
    const publisher = await prisma.publisher.create({
      data: { name: `TASK019 Publisher ${suffix}` },
    });
    authorId = author.id;
    publisherId = publisher.id;
    const work = await prisma.work.create({
      data: {
        title: `TASK019 ${suffix}`,
        slug: `task019-${suffix}`,
        synopsis: "Synthetic refund integration data.",
        releaseDate: new Date("2026-01-01T00:00:00Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: {
          create: [
            {
              format: "DIGITAL",
              priceCents: 2_500,
              inventory: {
                create: { digitalLicenseLimit: 3, digitalAllocated: 1 },
              },
            },
          ],
        },
      },
      include: { editions: { include: { inventory: true } } },
    });
    workId = work.id;
    const order = await prisma.order.create({
      data: {
        userId,
        idempotencyKey: `task019-${suffix}`,
        subtotalCents: 2_500,
        discountCents: 0,
        shippingCents: 0,
        totalCents: 2_500,
        items: {
          create: [
            {
              editionId: work.editions[0].id,
              workTitle: work.title,
              format: "DIGITAL",
              unitPriceCents: 2_500,
              quantity: 1,
            },
          ],
        },
        payment: { create: { status: "APPROVED", amountCents: 2_500 } },
      },
      include: { items: true },
    });
    orderId = order.id;

    const refund = await refundService.requestCancellation(
      order.id,
      order.items[0].id,
      userId,
      `task019-refund-${suffix}`,
      "Solicito cancelamento do pedido",
    );
    assert.equal(refund.status, "PROCESSED");
    assert.equal(refund.amountCents, 2_500);

    const retry = await refundService.requestCancellation(
      order.id,
      order.items[0].id,
      userId,
      `task019-refund-${suffix}`,
      "Solicito cancelamento do pedido",
    );
    assert.equal(retry.id, refund.id);

    const [inventory, payment, persistedOrder, releases, auditCount] =
      await Promise.all([
        prisma.inventory.findUniqueOrThrow({
          where: { editionId: work.editions[0].id },
        }),
        prisma.payment.findUniqueOrThrow({ where: { orderId: order.id } }),
        prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
        prisma.inventoryMovement.count({
          where: {
            inventoryId: work.editions[0].inventory.id,
            type: "DIGITAL_RELEASE",
          },
        }),
        prisma.auditLog.count({
          where: { targetType: "REFUND", targetId: refund.id },
        }),
      ]);
    assert.equal(inventory.digitalAllocated, 0);
    assert.equal(payment.refundedCents, 2_500);
    assert.equal(payment.status, "REFUNDED");
    assert.equal(persistedOrder.status, "REFUNDED");
    assert.equal(releases, 1);
    assert.equal(auditCount, 2);
  } finally {
    if (orderId) {
      await prisma.refund.deleteMany({ where: { orderItem: { orderId } } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (workId) {
      const work = await prisma.work.findUnique({
        where: { id: workId },
        include: { editions: true },
      });
      if (work) {
        await prisma.inventoryMovement.deleteMany({
          where: {
            inventory: {
              editionId: { in: work.editions.map((edition) => edition.id) },
            },
          },
        });
        await prisma.work.delete({ where: { id: workId } });
      }
    }
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (authorId) await prisma.author.deleteMany({ where: { id: authorId } });
    if (publisherId)
      await prisma.publisher.deleteMany({ where: { id: publisherId } });
    await app.close();
    await prisma.$disconnect();
  }
});
