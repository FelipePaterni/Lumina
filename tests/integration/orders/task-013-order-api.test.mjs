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

async function cleanPreviousSyntheticFixtures(prisma) {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: "task013-", endsWith: "@lumina.local" } },
    select: { id: true, email: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length) {
    await prisma.outboxEmail.deleteMany({ where: { toEmail: { in: users.map((user) => user.email) } } });
    await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.cart.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.libraryItem.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  }
  const bundles = await prisma.bundle.findMany({
    where: { name: { startsWith: "TASK013 unlimited bundle " } },
    select: { id: true },
  });
  const bundleIds = bundles.map((bundle) => bundle.id);
  if (bundleIds.length) {
    await prisma.bundleItem.deleteMany({ where: { bundleId: { in: bundleIds } } });
    await prisma.bundle.deleteMany({ where: { id: { in: bundleIds } } });
  }
  const works = await prisma.work.findMany({
    where: { title: { startsWith: "TASK013 " } },
    select: { id: true },
  });
  const workIds = works.map((work) => work.id);
  if (workIds.length) await prisma.work.deleteMany({ where: { id: { in: workIds } } });
  await prisma.author.deleteMany({ where: { name: { startsWith: "TASK013 Author " }, works: { none: {} } } });
  await prisma.publisher.deleteMany({ where: { name: { startsWith: "TASK013 Publisher " }, works: { none: {} } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

const cpf = "529.982.247-25";
const address = {
  recipientName: "Cliente Sintético",
  cpf,
  phone: "11987654321",
  postalCode: "01001-000",
  street: "Rua Sintética",
  number: "10",
  district: "Centro",
  city: "São Paulo",
  state: "SP",
};

test("TASK-013 checkout is atomic, idempotent, private, and enforces payment and ownership", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  const users = [];
  const works = [];
  const bundleIds = [];
  const couponIds = [];
  const shippingRuleIds = [];
  let baseUrl;

  try {
    await prisma.$connect();
    await cleanPreviousSyntheticFixtures(prisma);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    for (const role of ["CUSTOMER", "CUSTOMER", "ADMIN"]) {
      users.push(await prisma.user.create({
        data: { email: `task013-${role.toLowerCase()}-${users.length}-${suffix}@lumina.local`, passwordHash: "synthetic-only", role, isEmailConfirmed: true },
      }));
    }
    const [customerA, customerB, admin] = users;
    const author = await prisma.author.create({ data: { name: `TASK013 Author ${suffix}` } });
    const publisher = await prisma.publisher.create({ data: { name: `TASK013 Publisher ${suffix}` } });
    const makeWork = async (name, editions) => {
      const work = await prisma.work.create({
        data: {
          title: `TASK013 ${name} ${suffix}`,
          slug: `task013-${name.toLowerCase()}-${suffix}`,
          synopsis: "Synthetic integration data.",
          releaseDate: new Date("2026-01-01T00:00:00Z"),
          authorId: author.id,
          publisherId: publisher.id,
          editions: { create: editions },
        },
        include: { editions: true },
      });
      works.push(work);
      return work.editions;
    };

    const hybridEditions = await makeWork("Hybrid", [
      { format: "PHYSICAL", priceCents: 2_000, inventory: { create: { physicalStock: 5 } } },
      { format: "DIGITAL", priceCents: 0, inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } } },
    ]);
    const stockEditions = await makeWork("Stock race", [
      { format: "PHYSICAL", priceCents: 1_000, inventory: { create: { physicalStock: 1 } } },
    ]);
    const couponEditions = await makeWork("Coupon race", [
      { format: "DIGITAL", priceCents: 1_000, inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } } },
    ]);
    const shippingRule = await prisma.shippingRule.create({
      data: { postalCodeStart: "01000000", postalCodeEnd: "01999999", minPhysicalQuantity: 1, maxPhysicalQuantity: 5, priceCents: 500, priority: 1 },
    });
    shippingRuleIds.push(shippingRule.id);
    const quotaCoupon = await prisma.coupon.create({
      data: {
        code: `T013-${suffix}`,
        discountType: "PERCENTAGE",
        percentageBasisPoints: 10_000,
        validFrom: new Date(Date.now() - 60_000),
        validUntil: new Date(Date.now() + 3_600_000),
        maxUses: 1,
      },
    });
    couponIds.push(quotaCoupon.id);

    const tokenService = new JwtTokenService();
    const token = (user, isEmailConfirmed = true) => tokenService.sign({
      sub: user.id, email: user.email, role: user.role, isEmailConfirmed,
    });
    await app.listen(0, "127.0.0.1");
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
    const request = (path, { auth, method = "GET", body, key } = {}) => globalThis.fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const customerAToken = token(customerA);
    const customerBToken = token(customerB);
    const cartA = await prisma.cart.create({ data: { userId: customerA.id } });
    const cartB = await prisma.cart.create({ data: { userId: customerB.id } });

    assert.equal((await request("/checkout", { method: "POST", key: `task013-anon-${suffix}` })).status, 401);
    assert.equal((await request("/checkout", { auth: token(admin), method: "POST", key: `task013-admin-${suffix}` })).status, 403);
    assert.equal((await request("/checkout", { auth: token(customerA, false), method: "POST", key: `task013-unconfirmed-${suffix}` })).status, 403);
    assert.equal((await request("/checkout", { auth: customerAToken, method: "POST" })).status, 400);
    assert.equal((await request("/checkout", { auth: customerAToken, method: "POST", key: `task013-empty-${suffix}` })).status, 409);

    const physical = hybridEditions.find((edition) => edition.format === "PHYSICAL");
    const digitalFree = hybridEditions.find((edition) => edition.format === "DIGITAL");
    await prisma.cartItem.createMany({ data: [
      { cartId: cartA.id, editionId: physical.id, quantity: 2 },
      { cartId: cartA.id, editionId: digitalFree.id, quantity: 1 },
    ] });

    const invalidAddress = await request("/checkout", {
      auth: customerAToken, method: "POST", key: `task013-invalid-${suffix}`,
      body: { shippingAddress: { ...address, cpf: "111.111.111-11" } },
    });
    assert.equal(invalidAddress.status, 400);
    assert.equal(await prisma.order.count({ where: { userId: customerA.id } }), 0);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: physical.id } })).physicalStock, 5);

    const hybridKey = `task013-hybrid-${suffix}`;
    const hybridRequests = await Promise.all([
      request("/checkout", { auth: customerAToken, method: "POST", key: hybridKey, body: { shippingAddress: address } }),
      request("/checkout", { auth: customerAToken, method: "POST", key: hybridKey, body: { shippingAddress: address } }),
    ]);
    assert.deepEqual(hybridRequests.map((response) => response.status), [201, 201]);
    const hybridOrders = await Promise.all(hybridRequests.map((response) => response.json()));
    assert.equal(hybridOrders[0].id, hybridOrders[1].id);
    assert.equal(await prisma.outboxEmail.count({
      where: { eventKey: `order:${hybridOrders[0].id}:confirmed`, eventType: "ORDER_CONFIRMED", deliveryStatus: "SENT" },
    }), 1);
    assert.equal(await prisma.outboxEmail.count({ where: { eventType: "ORDER_CONFIRMED", toEmail: customerA.email } }), 1);
    assert.equal(hybridOrders[0].totalCents, 4_500);
    assert.equal(hybridOrders[0].payment.status, "APPROVED");
    assert.equal(hybridOrders[0].shippingAddress.postalCode, "01001000");
    assert.equal(JSON.stringify(hybridOrders[0]).includes(cpf), false);
    assert.equal(await prisma.order.count({ where: { userId: customerA.id } }), 1);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: physical.id } })).physicalStock, 3);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: digitalFree.id } })).digitalAllocated, 1);
    assert.equal(await prisma.cartItem.count({ where: { cartId: cartA.id } }), 0);
    assert.equal((await request(`/orders/${hybridOrders[0].id}`, { auth: customerAToken })).status, 200);
    assert.equal((await request(`/orders/${hybridOrders[0].id}`, { auth: customerBToken })).status, 404);

    const freeDigital = await makeWork("Free digital without inventory", [
      { format: "DIGITAL", priceCents: 0 },
    ]);
    await prisma.cartItem.create({ data: { cartId: cartB.id, editionId: freeDigital[0].id, quantity: 1 } });
    const freeResponse = await request("/checkout", {
      auth: customerBToken, method: "POST", key: `task013-free-${suffix}`,
    });
    assert.equal(freeResponse.status, 201);
    const freeOrder = await freeResponse.json();
    assert.equal(freeOrder.totalCents, 0);
    assert.equal(freeOrder.payment.status, "NOT_REQUIRED");
    assert.equal(freeOrder.shippingAddress, null);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: freeDigital[0].id } })).digitalAllocated, 1);
    assert.equal(await prisma.outboxEmail.count({
      where: { eventKey: `order:${freeOrder.id}:confirmed`, eventType: "ORDER_CONFIRMED", deliveryStatus: "SENT" },
    }), 1);

    const bundleWorks = await Promise.all([
      makeWork("Unconfigured bundle one", [{ format: "DIGITAL", priceCents: 800 }]),
      makeWork("Unconfigured bundle two", [{ format: "DIGITAL", priceCents: 900 }]),
    ]);
    const bundleResponse = await request("/bundles", {
      auth: token(admin), method: "POST",
      body: {
        name: `TASK013 unlimited bundle ${suffix}`,
        priceCents: 1_200,
        workIds: bundleWorks.map(([edition]) => edition.workId ?? edition.id),
        reason: "Synthetic unlimited bundle validation",
      },
    });
    assert.equal(bundleResponse.status, 201);
    const bundle = await bundleResponse.json();
    bundleIds.push(bundle.id);
    assert.equal(bundle.items.every((item) => item.available), true);
    const addedBundle = await request("/cart/bundles", {
      auth: customerBToken, method: "POST", body: { bundleId: bundle.id },
    });
    assert.equal(addedBundle.status, 201);
    const bundleOrderResponse = await request("/checkout", {
      auth: customerBToken, method: "POST", key: `task013-unlimited-bundle-${suffix}`,
    });
    assert.equal(bundleOrderResponse.status, 201);
    for (const [edition] of bundleWorks) {
      assert.equal((await prisma.inventory.findUnique({ where: { editionId: edition.id } })).digitalAllocated, 1);
    }

    const stockEdition = stockEditions[0];
    await prisma.cartItem.createMany({ data: [
      { cartId: cartA.id, editionId: stockEdition.id, quantity: 1 },
      { cartId: cartB.id, editionId: stockEdition.id, quantity: 1 },
    ] });
    const stockRace = await Promise.all([
      request("/checkout", { auth: customerAToken, method: "POST", key: `task013-stock-a-${suffix}`, body: { shippingAddress: address } }),
      request("/checkout", { auth: customerBToken, method: "POST", key: `task013-stock-b-${suffix}`, body: { shippingAddress: address } }),
    ]);
    assert.deepEqual(stockRace.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: stockEdition.id } })).physicalStock, 0);
    assert.equal(await prisma.order.count({ where: { items: { some: { editionId: stockEdition.id } } } }), 1);
    assert.equal(await prisma.cartItem.count({ where: { cartId: { in: [cartA.id, cartB.id] }, editionId: stockEdition.id } }), 1);

    const limitedDigital = await makeWork("Digital license race", [
      { format: "DIGITAL", priceCents: 1_000, inventory: { create: { digitalLicenseLimit: 1, digitalAllocated: 0 } } },
    ]);
    await prisma.cartItem.deleteMany({ where: { cartId: { in: [cartA.id, cartB.id] } } });
    await prisma.cart.updateMany({ where: { id: { in: [cartA.id, cartB.id] } }, data: { couponId: null } });
    await prisma.cartItem.createMany({ data: [
      { cartId: cartA.id, editionId: limitedDigital[0].id, quantity: 1 },
      { cartId: cartB.id, editionId: limitedDigital[0].id, quantity: 1 },
    ] });
    const licenseRace = await Promise.all([
      request("/checkout", { auth: customerAToken, method: "POST", key: `task013-license-a-${suffix}` }),
      request("/checkout", { auth: customerBToken, method: "POST", key: `task013-license-b-${suffix}` }),
    ]);
    assert.deepEqual(licenseRace.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await prisma.inventory.findUnique({ where: { editionId: limitedDigital[0].id } })).digitalAllocated, 1);
    assert.equal(await prisma.order.count({ where: { items: { some: { editionId: limitedDigital[0].id } } } }), 1);

    const couponEdition = couponEditions[0];
    await prisma.cartItem.deleteMany({ where: { cartId: { in: [cartA.id, cartB.id] } } });
    await prisma.cart.updateMany({ where: { userId: { in: [customerA.id, customerB.id] } }, data: { couponId: quotaCoupon.id } });
    await prisma.cartItem.createMany({ data: [
      { cartId: cartA.id, editionId: couponEdition.id, quantity: 1 },
      { cartId: cartB.id, editionId: couponEdition.id, quantity: 1 },
    ] });
    const couponRace = await Promise.all([
      request("/checkout", { auth: customerAToken, method: "POST", key: `task013-coupon-a-${suffix}` }),
      request("/checkout", { auth: customerBToken, method: "POST", key: `task013-coupon-b-${suffix}` }),
    ]);
    assert.deepEqual(couponRace.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await prisma.coupon.findUnique({ where: { id: quotaCoupon.id } })).usageCount, 1);
    assert.equal(await prisma.order.count({ where: { couponCode: quotaCoupon.code } }), 1);
  } finally {
    await app.close();
    if (users.length) {
      await prisma.outboxEmail.deleteMany({
        where: { eventType: "ORDER_CONFIRMED", toEmail: { in: users.map((user) => user.email) } },
      });
      await prisma.order.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
      await prisma.cart.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
      await prisma.libraryItem.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    }
    if (couponIds.length) await prisma.coupon.deleteMany({ where: { id: { in: couponIds } } });
    if (shippingRuleIds.length) await prisma.shippingRule.deleteMany({ where: { id: { in: shippingRuleIds } } });
    if (bundleIds.length) {
      await prisma.bundleItem.deleteMany({ where: { bundleId: { in: bundleIds } } });
      await prisma.bundle.deleteMany({ where: { id: { in: bundleIds } } });
    }
    if (users.length) await prisma.auditLog.deleteMany({ where: { actorId: { in: users.map((user) => user.id) } } });
    if (works.length) await prisma.work.deleteMany({ where: { id: { in: works.map((work) => work.id) } } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    if (works.length) {
      const [author] = await prisma.author.findMany({ where: { name: { contains: "TASK013 Author" } }, select: { id: true } });
      const [publisher] = await prisma.publisher.findMany({ where: { name: { contains: "TASK013 Publisher" } }, select: { id: true } });
      if (author) await prisma.author.deleteMany({ where: { id: author.id } });
      if (publisher) await prisma.publisher.deleteMany({ where: { id: publisher.id } });
    }
    await prisma.$disconnect();
  }
});
