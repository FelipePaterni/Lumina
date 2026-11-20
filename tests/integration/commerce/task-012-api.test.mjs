import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const syntheticCpf = "529.982.247-25";
const syntheticAddress = {
  recipientName: "Cliente Sintético",
  cpf: syntheticCpf,
  phone: "11987654321",
  postalCode: "01001-000",
  street: "Rua Sintética",
  number: "10",
  district: "Centro",
  city: "São Paulo",
  state: "SP",
};

test("TASK-012 cart API enforces ownership, coupon, shipping, and role boundaries", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  let customer;
  let admin;
  let author;
  let publisher;
  let work;
  let physical;
  let digital;
  let validCoupon;
  let exhaustedCoupon;
  let expiredCoupon;
  let shippingRule;
  let adminCreatedCouponId;
  let adminCreatedShippingRuleId;
  let baseUrl;

  try {
    await prisma.$connect();
    customer = await prisma.user.create({ data: { email: `task012-${Date.now()}@lumina.local`, passwordHash: "synthetic-only", role: "CUSTOMER", isEmailConfirmed: true } });
    admin = await prisma.user.create({ data: { email: `task012-admin-${Date.now()}@lumina.local`, passwordHash: "synthetic-only", role: "ADMIN", isEmailConfirmed: true } });
    author = await prisma.author.create({ data: { name: `TASK012 Synthetic Author ${Date.now()}` } });
    publisher = await prisma.publisher.create({ data: { name: `TASK012 Synthetic Publisher ${Date.now()}` } });
    work = await prisma.work.create({
      data: {
        title: "TASK-012 Synthetic Work",
        slug: `task-012-synthetic-${Date.now()}`,
        synopsis: "Synthetic integration fixture.",
        releaseDate: new Date("2026-01-01T00:00:00Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: { create: [
          { format: "PHYSICAL", priceCents: 4_290, inventory: { create: { physicalStock: 3 } } },
          { format: "DIGITAL", priceCents: 1_590, inventory: { create: { digitalLicenseLimit: 10, digitalAllocated: 0 } } },
        ] },
      },
      include: { editions: true },
    });
    physical = work.editions.find((edition) => edition.format === "PHYSICAL");
    digital = work.editions.find((edition) => edition.format === "DIGITAL");
    const now = new Date();
    validCoupon = await prisma.coupon.create({ data: { code: `T012-${Date.now()}`, discountType: "FIXED", fixedAmountCents: 500, validFrom: new Date(now.getTime() - 60_000), validUntil: new Date(now.getTime() + 3_600_000), maxUses: 1 } });
    exhaustedCoupon = await prisma.coupon.create({ data: { code: `T012X-${Date.now()}`, discountType: "FIXED", fixedAmountCents: 100, validFrom: new Date(now.getTime() - 60_000), validUntil: new Date(now.getTime() + 3_600_000), maxUses: 1, usageCount: 1 } });
    expiredCoupon = await prisma.coupon.create({ data: { code: `T012E-${Date.now()}`, discountType: "FIXED", fixedAmountCents: 100, validFrom: new Date(now.getTime() - 3_600_000), validUntil: new Date(now.getTime() - 60_000), maxUses: 1 } });
    shippingRule = await prisma.shippingRule.create({ data: { postalCodeStart: "01000000", postalCodeEnd: "01999999", minPhysicalQuantity: 1, maxPhysicalQuantity: 3, priceCents: 900, priority: 1 } });
    await prisma.libraryItem.create({ data: { userId: customer.id, editionId: digital.id } });

    const tokenService = new JwtTokenService();
    const customerToken = tokenService.sign({ sub: customer.id, email: customer.email, role: "CUSTOMER", isEmailConfirmed: true });
    const adminToken = tokenService.sign({ sub: admin.id, email: admin.email, role: "ADMIN", isEmailConfirmed: true });
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const request = (path, { token, method = "GET", body } = {}) => globalThis.fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    assert.equal((await request("/cart")).status, 401);
    assert.equal((await request("/cart", { token: adminToken })).status, 403);
    assert.equal((await request("/cart", { token: customerToken })).status, 200);

    const adminCouponResponse = await request("/admin/coupons", { token: adminToken, method: "POST", body: {
      code: `T012A-${Date.now()}`, discountType: "FIXED", fixedAmountCents: 100,
      validFrom: new Date(Date.now() - 60_000).toISOString(), validUntil: new Date(Date.now() + 3_600_000).toISOString(), maxUses: 1,
    } });
    assert.equal(adminCouponResponse.status, 201);
    const adminCouponBody = await adminCouponResponse.json();
    adminCreatedCouponId = adminCouponBody.id;
    assert.match(adminCouponBody.code, /^T012A-/);
    assert.equal((await request(`/admin/coupons/${adminCouponBody.id}/active`, { token: adminToken, method: "PATCH", body: { isActive: false } })).status, 200);
    assert.equal((await request("/cart/coupon", { token: customerToken, method: "POST", body: { code: adminCouponBody.code } })).status, 409);

    const adminShippingResponse = await request("/admin/shipping-rules", { token: adminToken, method: "POST", body: {
      postalCodeStart: "99000000", postalCodeEnd: "99999999", minPhysicalQuantity: 1,
      maxPhysicalQuantity: 1, priceCents: 1_100, priority: 0,
    } });
    assert.equal(adminShippingResponse.status, 201);
    const adminRuleBody = await adminShippingResponse.json();
    adminCreatedShippingRuleId = adminRuleBody.id;
    assert.equal((await request(`/admin/shipping-rules/${adminRuleBody.id}/active`, { token: adminToken, method: "PATCH", body: { isActive: false } })).status, 200);
    assert.equal((await request("/admin/shipping-rules", { token: customerToken, method: "POST", body: {
      postalCodeStart: "99000000", postalCodeEnd: "99999999", minPhysicalQuantity: 1, priceCents: 1_100,
    } })).status, 403);

    const addPhysical = await request("/cart/items", { token: customerToken, method: "POST", body: { editionId: physical.id, quantity: 2 } });
    assert.equal(addPhysical.status, 201);
    assert.equal((await addPhysical.json()).subtotalCents, 8_580);
    const applyCoupon = await request("/cart/coupon", { token: customerToken, method: "POST", body: { code: validCoupon.code.toLowerCase() } });
    assert.equal(applyCoupon.status, 201);
    assert.equal((await applyCoupon.json()).discountCents, 500);
    assert.equal((await request("/cart/coupon", { token: customerToken, method: "POST", body: { code: exhaustedCoupon.code } })).status, 409);
    assert.equal((await request("/cart/coupon", { token: customerToken, method: "POST", body: { code: expiredCoupon.code } })).status, 409);

    const invalidCpf = await request("/cart/shipping-quote", { token: customerToken, method: "POST", body: { address: { ...syntheticAddress, cpf: "111.111.111-11" } } });
    assert.equal(invalidCpf.status, 400);
    const shipping = await request("/cart/shipping-quote", { token: customerToken, method: "POST", body: { address: syntheticAddress } });
    assert.equal(shipping.status, 201);
    const shippingBody = await shipping.json();
    assert.equal(shippingBody.shippingCents, 900);
    assert.equal(shippingBody.totalCents, 8_980);

    assert.equal((await request("/cart/items", { token: customerToken, method: "POST", body: { editionId: digital.id, quantity: 1 } })).status, 409);
    await prisma.libraryItem.deleteMany({ where: { userId: customer.id, editionId: digital.id } });
    assert.equal((await request("/cart/items", { token: customerToken, method: "POST", body: { editionId: digital.id, quantity: 1 } })).status, 201);
    assert.equal((await request("/admin/shipping-rules", { token: customerToken })).status, 403);
    assert.equal((await request(`/cart/items/${physical.id}`, { token: customerToken, method: "DELETE" })).status, 200);
    const digitalOnlyQuote = await request("/cart/shipping-quote", { token: customerToken, method: "POST", body: { address: null } });
    assert.equal(digitalOnlyQuote.status, 201);
    assert.equal((await digitalOnlyQuote.json()).shippingCents, 0);
    assert.equal((await request(`/cart/items/${digital.id}`, { token: customerToken, method: "DELETE" })).status, 200);
  } finally {
    await app.close();
    if (customer) {
      await prisma.cart.deleteMany({ where: { userId: customer.id } });
      await prisma.libraryItem.deleteMany({ where: { userId: customer.id } });
    }
    if (shippingRule) await prisma.shippingRule.deleteMany({ where: { id: shippingRule.id } });
    if (adminCreatedShippingRuleId) await prisma.shippingRule.deleteMany({ where: { id: adminCreatedShippingRuleId } });
    if (adminCreatedCouponId) await prisma.coupon.deleteMany({ where: { id: adminCreatedCouponId } });
    if (validCoupon) await prisma.coupon.deleteMany({ where: { id: { in: [validCoupon.id, exhaustedCoupon.id, expiredCoupon.id] } } });
    if (work) await prisma.work.deleteMany({ where: { id: work.id } });
    if (author) await prisma.author.deleteMany({ where: { id: author.id } });
    if (publisher) await prisma.publisher.deleteMany({ where: { id: publisher.id } });
    if (customer) await prisma.user.deleteMany({ where: { id: customer.id } });
    if (admin) await prisma.user.deleteMany({ where: { id: admin.id } });
    await prisma.$disconnect();
  }
});
