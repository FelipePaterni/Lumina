import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { PrismaClient } from "@prisma/client";
import { URL } from "node:url";

const databaseUrl = process.env.TASK009_TEST_DATABASE_URL;
const customerEmail = process.env.TASK019_CUSTOMER_EMAIL?.trim().toLowerCase();
assert.ok(
  databaseUrl,
  "Configure TASK009_TEST_DATABASE_URL para o banco isolado.",
);
assert.ok(
  customerEmail,
  "Configure TASK019_CUSTOMER_EMAIL com um CUSTOMER sintético.",
);
const parsedUrl = new URL(databaseUrl);
assert.equal(
  decodeURIComponent(parsedUrl.pathname.slice(1)),
  "lumina_task009_test",
  "O preparador só pode escrever na base isolada lumina_task009_test.",
);

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

try {
  const customer = await prisma.user.findUnique({
    where: { email: customerEmail },
  });
  assert.ok(
    customer && customer.role === "CUSTOMER" && customer.isActive,
    "A conta informada precisa existir e ser CUSTOMER ativa.",
  );
  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const fixture = await prisma.$transaction(async (tx) => {
    const author = await tx.author.create({
      data: { name: `TASK019 Manual Author ${suffix}` },
    });
    const publisher = await tx.publisher.create({
      data: { name: `TASK019 Manual Publisher ${suffix}` },
    });
    const work = await tx.work.create({
      data: {
        title: `TASK019 Manual ${suffix}`,
        slug: `task019-manual-${suffix}`,
        synopsis:
          "Synthetic physical order for the TASK-019 manual acceptance flow.",
        releaseDate: new Date("2026-01-01T00:00:00Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: {
          create: [
            {
              format: "PHYSICAL",
              priceCents: 2_700,
              inventory: { create: { physicalStock: 0 } },
            },
          ],
        },
      },
      include: { editions: { include: { inventory: true } } },
    });
    const order = await tx.order.create({
      data: {
        userId: customer.id,
        idempotencyKey: `task019-manual-${suffix}`,
        status: "CONFIRMED",
        fulfillmentStatus: "PENDING",
        subtotalCents: 2_700,
        discountCents: 0,
        shippingCents: 0,
        totalCents: 2_700,
        items: {
          create: [
            {
              editionId: work.editions[0].id,
              workTitle: work.title,
              format: "PHYSICAL",
              unitPriceCents: 2_700,
              quantity: 1,
            },
          ],
        },
        payment: { create: { status: "APPROVED", amountCents: 2_700 } },
      },
      include: { items: true },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: work.editions[0].inventory.id,
        type: "PHYSICAL_SALE",
        quantity: 1,
        reason: "Pedido físico sintético preparado para TASK-019",
        actorId: customer.id,
      },
    });
    return { orderId: order.id, orderItemId: order.items[0].id };
  });
  process.stdout.write(`${JSON.stringify(fixture)}\n`);
} finally {
  await prisma.$disconnect();
}
