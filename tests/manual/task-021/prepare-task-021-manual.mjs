import assert from "node:assert/strict";
import process from "node:process";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getTaskCustomerEmails, getTaskDatabaseUrl, getTaskLoginCredentials, loadLocalEnvironment } from "./manual-environment.mjs";

loadLocalEnvironment();
let databaseUrl;
let customer1Email;
let customer2Email;
let loginCredentials;
try {
  databaseUrl = getTaskDatabaseUrl();
  ({ customer1Email, customer2Email } = getTaskCustomerEmails());
  loginCredentials = getTaskLoginCredentials();
} catch (error) {
  process.stderr.write(`BLOQUEADO: ${error instanceof Error ? error.message : "Configuração manual inválida."}\n`);
  process.exit(2);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
try {
  const [customer1, customer2] = await Promise.all([
    prisma.user.findUnique({ where: { email: customer1Email } }),
    prisma.user.findUnique({ where: { email: customer2Email } }),
  ]);
  assert.ok(customer1?.role === "CUSTOMER" && customer1.isActive, "A primeira conta deve ser CUSTOMER sintética ativa.");
  assert.ok(customer2?.role === "CUSTOMER" && customer2.isActive, "A segunda conta deve ser CUSTOMER sintética ativa.");

  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const stockEmail = `task021-stock-${randomUUID().slice(0, 12)}@example.invalid`;
  const stockPassword = randomUUID() + randomUUID();
  const fixtures = await prisma.$transaction(async (tx) => {
    const ensureSyntheticUser = async (email, password, role) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && existing.role !== role) throw new Error("Conta sintética configurada com papel inesperado.");
      const passwordHash = await bcrypt.hash(password, 10);
      const data = { passwordHash, role, isEmailConfirmed: true, isActive: true, deactivatedAt: null, scheduledDeletionAt: null };
      if (existing) return tx.user.update({ where: { id: existing.id }, data });
      return tx.user.create({ data: { email, ...data } });
    };
    await ensureSyntheticUser(loginCredentials.adminEmail, loginCredentials.adminPassword, "ADMIN");
    await ensureSyntheticUser(customer1Email, loginCredentials.customer1Password, "CUSTOMER");
    await ensureSyntheticUser(customer2Email, loginCredentials.customer2Password, "CUSTOMER");
    await ensureSyntheticUser(stockEmail, stockPassword, "STOCK");
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
  fixtures.stockCredential = { email: stockEmail, password: stockPassword };
  process.stdout.write(`${JSON.stringify(fixtures)}\n`);
} finally {
  await prisma.$disconnect();
}
