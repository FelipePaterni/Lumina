import assert from "node:assert/strict";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TASK009_TEST_DATABASE_URL;
const customer1Email = process.env.TASK021_CUSTOMER_1_EMAIL?.trim().toLowerCase();
const customer2Email = process.env.TASK021_CUSTOMER_2_EMAIL?.trim().toLowerCase();
assert.ok(databaseUrl, "Configure TASK009_TEST_DATABASE_URL para o banco isolado.");
assert.ok(customer1Email && customer2Email && customer1Email !== customer2Email, "Configure dois CUSTOMER sintéticos distintos para TASK-021.");
assert.ok(customer1Email.endsWith("@example.invalid") && customer2Email.endsWith("@example.invalid"), "Contas sintéticas devem usar o domínio reservado example.invalid.");
const parsedUrl = new URL(databaseUrl);
assert.equal(decodeURIComponent(parsedUrl.pathname.slice(1)), "lumina_task009_test", "O preparador só pode escrever na base isolada lumina_task009_test.");

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
try {
  const [customer1, customer2] = await Promise.all([
    prisma.user.findUnique({ where: { email: customer1Email } }),
    prisma.user.findUnique({ where: { email: customer2Email } }),
  ]);
  assert.ok(customer1?.role === "CUSTOMER" && customer1.isActive, "A primeira conta deve ser CUSTOMER sintética ativa.");
  assert.ok(customer2?.role === "CUSTOMER" && customer2.isActive, "A segunda conta deve ser CUSTOMER sintética ativa.");

  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const fixtures = await prisma.$transaction(async (tx) => {
    const [author, publisher] = await Promise.all([
      tx.author.create({ data: { name: `TASK021 Manual Author ${suffix}` } }),
      tx.publisher.create({ data: { name: `TASK021 Manual Publisher ${suffix}` } }),
    ]);
    const createOrderFixture = async (kind, releaseDate) => {
      const work = await tx.work.create({
        data: {
          title: `TASK021 ${kind} ${suffix}`,
          slug: `task021-${kind.toLowerCase()}-${suffix}`,
          synopsis: "Synthetic physical fulfillment fixture for TASK-021.",
          releaseDate,
          authorId: author.id,
          publisherId: publisher.id,
          editions: { create: [{ format: "PHYSICAL", priceCents: 2_700, inventory: { create: { physicalStock: 0 } } }] },
        },
        include: { editions: { include: { inventory: true } } },
      });
      const order = await tx.order.create({
        data: {
          userId: customer1.id,
          idempotencyKey: `task021-${kind.toLowerCase()}-${suffix}`,
          status: "CONFIRMED",
          fulfillmentStatus: "PENDING",
          subtotalCents: 2_700,
          discountCents: 0,
          shippingCents: 900,
          totalCents: 3_600,
          items: { create: [{ editionId: work.editions[0].id, workTitle: work.title, format: "PHYSICAL", unitPriceCents: 2_700, quantity: 1 }] },
          shippingAddress: { create: {
            recipientName: "Cliente Sintético TASK021",
            phone: "11999990000",
            postalCode: "01001000",
            street: "Rua Sintética",
            number: "100",
            district: "Centro",
            city: "São Paulo",
            state: "SP",
          } },
          payment: { create: { status: "APPROVED", amountCents: 3_600 } },
        },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: work.editions[0].inventory.id,
          type: "PHYSICAL_SALE",
          quantity: 1,
          reason: "Pedido sintético TASK-021",
          actorId: customer1.id,
        },
      });
      return { orderId: order.id, editionId: work.editions[0].id, titlePrefix: `TASK021 ${kind} ` };
    };
    const released = await createOrderFixture("Released", new Date("2020-01-01T00:00:00.000Z"));
    const preorder = await createOrderFixture("Preorder", new Date(Date.now() + 14 * 86_400_000));
    return { released, preorder };
  });
  process.stdout.write(`${JSON.stringify(fixtures)}\n`);
} finally {
  await prisma.$disconnect();
}
