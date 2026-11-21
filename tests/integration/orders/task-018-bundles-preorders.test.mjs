import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function deployMigrations(databaseUrl) {
  execSync("npm run db:migrate", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

test("TASK-018 composes unique digital bundles, prices prior ownership, grants items separately and gates preorder release", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  const users = [];
  const works = [];
  const bundles = [];
  let baseUrl;

  try {
    await prisma.$connect();
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    for (const role of ["CUSTOMER", "CUSTOMER", "CUSTOMER", "CATALOG"]) {
      users.push(await prisma.user.create({
        data: { email: `task018-${role.toLowerCase()}-${users.length}-${suffix}@lumina.local`, passwordHash: "synthetic-only", role, isEmailConfirmed: true },
      }));
    }
    const [customerA, customerB, customerC, catalogUser] = users;
    const author = await prisma.author.create({ data: { name: `TASK018 Author ${suffix}` } });
    const publisher = await prisma.publisher.create({ data: { name: `TASK018 Publisher ${suffix}` } });
    const makeDigitalWork = async (name, priceCents, releaseDate) => {
      const work = await prisma.work.create({
        data: {
          title: `TASK018 ${name} ${suffix}`,
          slug: `task018-${name.toLowerCase()}-${suffix}`,
          synopsis: "Synthetic integration data.",
          releaseDate,
          authorId: author.id,
          publisherId: publisher.id,
          editions: { create: [{ format: "DIGITAL", priceCents, inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } } }] },
        },
        include: { editions: true },
      });
      works.push(work);
      return work;
    };
    const released = await makeDigitalWork("Released", 1_500, new Date("2026-01-01T00:00:00Z"));
    const future = await makeDigitalWork("Future", 1_200, new Date("2027-01-01T00:00:00Z"));
    await prisma.digitalAsset.create({
      data: {
        editionId: released.editions[0].id,
        versions: { create: { version: 1, storageKey: `original/${"a".repeat(64)}.pdf`, checksum: "a".repeat(64), mimeType: "application/pdf", isOriginal: true } },
      },
    });

    const seedOwnership = async (user, work, priceCents) => {
      const order = await prisma.order.create({
        data: { userId: user.id, idempotencyKey: `task018-seed-${user.id}-${work.id}`, subtotalCents: priceCents, discountCents: 0, shippingCents: 0, totalCents: priceCents },
      });
      await prisma.orderItem.create({
        data: { orderId: order.id, editionId: work.editions[0].id, workTitle: work.title, format: "DIGITAL", unitPriceCents: priceCents, quantity: 1 },
      });
    };
    await seedOwnership(customerA, released, 1_500);
    await seedOwnership(customerB, released, 1_500);
    await seedOwnership(customerB, future, 1_200);

    const tokenService = new JwtTokenService();
    const token = (user) => tokenService.sign({ sub: user.id, email: user.email, role: user.role, isEmailConfirmed: true });
    await app.listen(0, "127.0.0.1");
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
    const request = (pathName, { auth, method = "GET", body, key } = {}) => globalThis.fetch(`${baseUrl}${pathName}`, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const catalogToken = token(catalogUser);
    const customerAToken = token(customerA);
    const customerBToken = token(customerB);
    const customerCToken = token(customerC);
    const createBody = { name: `TASK018 bundle ${suffix}`, priceCents: 1_000, workIds: [released.id, future.id] };

    assert.equal((await request("/bundles", { method: "POST", body: createBody })).status, 401);
    assert.equal((await request("/bundles", { auth: customerAToken, method: "POST", body: createBody })).status, 403);
    const created = await request("/bundles", { auth: catalogToken, method: "POST", body: createBody });
    assert.equal(created.status, 201);
    const bundle = await created.json();
    bundles.push(bundle.id);
    const duplicateComposition = await request("/bundles", { auth: catalogToken, method: "POST", body: { ...createBody, name: `Different name ${suffix}`, workIds: [future.id, released.id] } });
    assert.equal(duplicateComposition.status, 409);

    await prisma.cart.createMany({ data: [customerA, customerB, customerC].map((user) => ({ userId: user.id })) });
    const customerACart = await prisma.cart.findUniqueOrThrow({ where: { userId: customerA.id } });
    const customerBCart = await prisma.cart.findUniqueOrThrow({ where: { userId: customerB.id } });
    const customerCCart = await prisma.cart.findUniqueOrThrow({ where: { userId: customerC.id } });

    const addPartialBundle = await request("/cart/bundles", { auth: customerAToken, method: "POST", body: { bundleId: bundle.id } });
    assert.equal(addPartialBundle.status, 201);
    const partialCart = await addPartialBundle.json();
    assert.equal(partialCart.subtotalCents, 0);
    assert.equal(partialCart.bundles[0].ownershipAdjustmentCents, 1_000);
    const partialCheckout = await request("/checkout", { auth: customerAToken, method: "POST", key: `task018-partial-${suffix}` });
    assert.equal(partialCheckout.status, 201);
    const partialOrder = await partialCheckout.json();
    assert.equal(partialOrder.payment.status, "NOT_REQUIRED");
    assert.equal(partialOrder.bundles[0].chargedPriceCents, 0);
    assert.deepEqual(partialOrder.bundles[0].items.map((item) => item.editionId), [future.editions[0].id]);
    assert.equal(partialOrder.bundles[0].items[0].preorderStatus, "PREORDER");
    assert.equal(await prisma.orderItem.count({ where: { orderId: partialOrder.id, bundlePurchaseId: { not: null } } }), 1);
    assert.equal(await prisma.cartBundle.count({ where: { cartId: customerACart.id } }), 0);

    const allOwned = await request("/cart/bundles", { auth: customerBToken, method: "POST", body: { bundleId: bundle.id } });
    assert.equal(allOwned.status, 409);
    assert.equal(await prisma.cartBundle.count({ where: { cartId: customerBCart.id } }), 0);

    const addFullBundle = await request("/cart/bundles", { auth: customerCToken, method: "POST", body: { bundleId: bundle.id } });
    assert.equal(addFullBundle.status, 201);
    const fullCart = await addFullBundle.json();
    assert.equal(fullCart.subtotalCents, 1_000);
    const fullCheckout = await request("/checkout", { auth: customerCToken, method: "POST", key: `task018-full-${suffix}` });
    assert.equal(fullCheckout.status, 201);
    const fullOrder = await fullCheckout.json();
    assert.equal(fullOrder.subtotalCents, 1_000);
    assert.equal(fullOrder.bundles[0].items.length, 2);
    assert.equal(fullOrder.bundles[0].items.find((item) => item.editionId === released.editions[0].id).preorderStatus, "RELEASED");
    assert.equal(fullOrder.bundles[0].items.find((item) => item.editionId === future.editions[0].id).preorderStatus, "PREORDER");
    assert.equal(await prisma.orderItem.count({ where: { orderId: fullOrder.id, bundlePurchaseId: { not: null } } }), 2);

    const libraryResponse = await request("/library", { auth: customerCToken });
    assert.equal(libraryResponse.status, 200);
    const libraryItems = await libraryResponse.json();
    assert.equal(libraryItems.length, 2);
    assert.equal(libraryItems.find((item) => item.editionId === released.editions[0].id).downloadAvailable, true);
    assert.equal(libraryItems.find((item) => item.editionId === future.editions[0].id).downloadAvailable, false);
    assert.equal(await prisma.inventory.findUnique({ where: { editionId: released.editions[0].id } }).then((row) => row.digitalAllocated), 1);
    assert.equal(await prisma.inventory.findUnique({ where: { editionId: future.editions[0].id } }).then((row) => row.digitalAllocated), 2);
    assert.equal(await prisma.cartBundle.count({ where: { cartId: customerCCart.id } }), 0);
  } finally {
    await app.close();
    if (users.length) {
      await prisma.order.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
      await prisma.cart.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    }
    if (bundles.length) await prisma.bundle.deleteMany({ where: { id: { in: bundles } } });
    if (works.length) await prisma.work.deleteMany({ where: { id: { in: works.map((work) => work.id) } } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    const authors = await prisma.author.findMany({ where: { name: { contains: "TASK018 Author" } }, select: { id: true } });
    const publishers = await prisma.publisher.findMany({ where: { name: { contains: "TASK018 Publisher" } }, select: { id: true } });
    if (authors.length) await prisma.author.deleteMany({ where: { id: { in: authors.map((row) => row.id) } } });
    if (publishers.length) await prisma.publisher.deleteMany({ where: { id: { in: publishers.map((row) => row.id) } } });
    await prisma.$disconnect();
  }
});
