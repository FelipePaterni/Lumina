import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

test("TASK-027 ranking filters compose with search and paginate consistently", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let buyer;
  let hiddenReviewer;
  let author;
  let publisher;
  let category;
  const works = [];
  let baseUrl;

  try {
    await prisma.$connect();
    buyer = await prisma.user.create({
      data: {
        email: `task027-buyer-${suffix}@example.invalid`,
        passwordHash: "synthetic-only",
        role: "CUSTOMER",
        isEmailConfirmed: true,
      },
    });
    hiddenReviewer = await prisma.user.create({
      data: {
        email: `task027-hidden-reviewer-${suffix}@example.invalid`,
        passwordHash: "synthetic-only",
        role: "CUSTOMER",
        isEmailConfirmed: true,
      },
    });
    [author, publisher, category] = await Promise.all([
      prisma.author.create({ data: { name: `TASK027 Author ${suffix}` } }),
      prisma.publisher.create({ data: { name: `TASK027 Publisher ${suffix}` } }),
      prisma.category.create({ data: { name: `TASK027 Category ${suffix}` } }),
    ]);

    const createWork = async ({ label, priceCents, releaseDate, visible = true }) => {
      const work = await prisma.work.create({
        data: {
          title: `TASK027 ${label} ${suffix}`,
          slug: `task027-${label.toLowerCase()}-${suffix}`,
          synopsis: "Synthetic ranking fixture.",
          releaseDate: new Date(releaseDate),
          language: "pt-BR",
          isVisible: visible,
          authorId: author.id,
          publisherId: publisher.id,
          editions: { create: [{ format: "DIGITAL", priceCents, isVisible: true }] },
        },
        include: { editions: true },
      });
      await prisma.workCategory.create({ data: { workId: work.id, categoryId: category.id } });
      works.push(work);
      return work;
    };

    const bestseller = await createWork({ label: "Visible Alpha", priceCents: 150, releaseDate: "2024-01-01" });
    const secondBest = await createWork({ label: "Visible Beta", priceCents: 250, releaseDate: "2025-01-01" });
    const noSales = await createWork({ label: "Visible Gamma", priceCents: 300, releaseDate: "2026-01-01" });
    const tiedNoSales = await createWork({ label: "Visible Delta", priceCents: 350, releaseDate: "2026-01-01" });
    const hidden = await createWork({ label: "Hidden Delta", priceCents: 100, releaseDate: "2026-01-01", visible: false });

    const createOrder = (work, label, quantity, status) => prisma.order.create({
      data: {
        userId: buyer.id,
        idempotencyKey: `task027-${label}-${suffix}`,
        status,
        subtotalCents: quantity * 100,
        discountCents: 0,
        shippingCents: 0,
        totalCents: quantity * 100,
        items: {
          create: [{
            editionId: work.editions[0].id,
            workTitle: work.title,
            format: "DIGITAL",
            unitPriceCents: 100,
            quantity,
          }],
        },
      },
      include: { items: true },
    });

    const bestsellerOrder = await createOrder(bestseller, "alpha", 7, "PARTIALLY_REFUNDED");
    await createOrder(secondBest, "beta", 4, "CONFIRMED");
    await createOrder(hidden, "hidden", 20, "CONFIRMED");
    await prisma.refund.create({
      data: {
        orderItemId: bestsellerOrder.items[0].id,
        requesterId: buyer.id,
        idempotencyKey: `task027-refund-${suffix}`,
        status: "PROCESSED",
        quantity: 2,
        amountCents: 200,
        requestReason: "Synthetic ranking refund",
      },
    });

    await prisma.review.createMany({
      data: [
        { userId: buyer.id, workId: bestseller.id, rating: 3, comment: "Synthetic visible rating", isVisible: true },
        { userId: hiddenReviewer.id, workId: bestseller.id, rating: 5, comment: "Synthetic hidden rating", isVisible: false },
        { userId: buyer.id, workId: secondBest.id, rating: 5, comment: "Synthetic visible rating", isVisible: true },
        { userId: buyer.id, workId: tiedNoSales.id, rating: 3, comment: "Synthetic visible rating", isVisible: true },
        { userId: buyer.id, workId: hidden.id, rating: 5, comment: "Synthetic hidden work rating", isVisible: true },
      ],
    });

    const jwt = new JwtTokenService();
    const token = jwt.sign({
      sub: buyer.id,
      email: buyer.email,
      role: "CUSTOMER",
      isEmailConfirmed: true,
    });
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const request = (query) => globalThis.fetch(`${baseUrl}/works?${query}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const categoryParam = `category=${encodeURIComponent(category.name)}`;

    let response = await request(`${categoryParam}&limit=10`);
    let result = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(result.items.map((item) => item.id), [tiedNoSales.id, noSales.id, secondBest.id, bestseller.id]);

    response = await request(`${categoryParam}&sort=BEST_SELLING&limit=1&page=1`);
    assert.equal(response.status, 200);
    result = await response.json();
    assert.equal(result.total, 4);
    assert.equal(result.totalPages, 4);
    assert.equal(result.items[0].id, bestseller.id);

    response = await request(`${categoryParam}&sort=BEST_SELLING&limit=1&page=2`);
    result = await response.json();
    assert.equal(result.items[0].id, secondBest.id);

    response = await request(`${categoryParam}&sort=BEST_SELLING&limit=2&page=2`);
    result = await response.json();
    assert.deepEqual(result.items.map((item) => item.id), [tiedNoSales.id, noSales.id]);

    response = await request(`${categoryParam}&sort=TOP_RATED&limit=10`);
    result = await response.json();
    assert.deepEqual(result.items.map((item) => item.id), [secondBest.id, bestseller.id, tiedNoSales.id, noSales.id]);
    assert.equal(result.items[1].averageRating, 3);
    assert.equal(result.items[1].reviewCount, 1);
    assert.equal(result.items[2].averageRating, 3);
    assert.equal(result.items[3].averageRating, null);

    response = await request(`${categoryParam}&search=TASK027%20Visible&language=pt-BR&minPriceCents=200&releaseFrom=2025-01-01&releaseTo=2027-01-01&sort=BEST_SELLING&limit=10`);
    result = await response.json();
    assert.deepEqual(result.items.map((item) => item.id), [secondBest.id, tiedNoSales.id, noSales.id]);
    assert.equal(result.total, 3);

    response = await request(`${categoryParam}&sort=UNKNOWN`);
    assert.equal(response.status, 400);

    response = await request(`${categoryParam}&search=TASK027-sem-resultados-${suffix}&sort=TOP_RATED`);
    result = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(result.items, []);
    assert.equal(result.total, 0);
    assert.equal(result.totalPages, 0);
  } finally {
    if (buyer && works.length) {
      const workIds = works.map((work) => work.id);
      await prisma.review.deleteMany({ where: { workId: { in: workIds } } });
      await prisma.refund.deleteMany({ where: { requesterId: buyer.id, idempotencyKey: { startsWith: `task027-refund-${suffix}` } } });
      await prisma.order.deleteMany({ where: { userId: buyer.id, idempotencyKey: { startsWith: `task027-` } } });
      await prisma.work.deleteMany({ where: { id: { in: workIds } } });
    }
    if (category) await prisma.category.delete({ where: { id: category.id } });
    if (author) await prisma.author.delete({ where: { id: author.id } });
    if (publisher) await prisma.publisher.delete({ where: { id: publisher.id } });
    if (buyer) await prisma.user.delete({ where: { id: buyer.id } });
    if (hiddenReviewer) await prisma.user.delete({ where: { id: hiddenReviewer.id } });
    if (baseUrl) await app.close();
    await prisma.$disconnect();
  }
});
