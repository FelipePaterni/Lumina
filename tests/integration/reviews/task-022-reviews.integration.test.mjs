import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

test("TASK-022 reviews, reports, moderation, and visible catalog ratings", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const app = await NestFactory.create(AppModule, { logger: false });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let buyer;
  let reporter;
  let nonBuyer;
  let admin;
  let author;
  let publisher;
  let work;
  let reviewId;
  let baseUrl;

  try {
    await prisma.$connect();
    [buyer, reporter, nonBuyer, admin] = await Promise.all([
      prisma.user.create({
        data: {
          email: `task022-buyer-${suffix}@example.invalid`,
          passwordHash: "synthetic-only",
          role: "CUSTOMER",
          isEmailConfirmed: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `task022-reporter-${suffix}@example.invalid`,
          passwordHash: "synthetic-only",
          role: "STOCK",
          isEmailConfirmed: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `task022-nonbuyer-${suffix}@example.invalid`,
          passwordHash: "synthetic-only",
          role: "CUSTOMER",
          isEmailConfirmed: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `task022-admin-${suffix}@example.invalid`,
          passwordHash: "synthetic-only",
          role: "ADMIN",
          isEmailConfirmed: true,
        },
      }),
    ]);
    [author, publisher] = await Promise.all([
      prisma.author.create({
        data: { name: `TASK022 Synthetic Author ${suffix}` },
      }),
      prisma.publisher.create({
        data: { name: `TASK022 Synthetic Publisher ${suffix}` },
      }),
    ]);
    work = await prisma.work.create({
      data: {
        title: `TASK-022 Synthetic Work ${suffix}`,
        slug: `task-022-synthetic-${suffix}`,
        synopsis: "Synthetic review integration fixture.",
        releaseDate: new Date("2026-01-01T00:00:00.000Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: { create: [{ format: "DIGITAL", priceCents: 100 }] },
      },
      include: { editions: true },
    });
    await prisma.order.create({
      data: {
        userId: buyer.id,
        idempotencyKey: `task022-${suffix}`,
        status: "CONFIRMED",
        subtotalCents: 100,
        discountCents: 0,
        shippingCents: 0,
        totalCents: 100,
        items: {
          create: [
            {
              editionId: work.editions[0].id,
              workTitle: work.title,
              format: "DIGITAL",
              unitPriceCents: 100,
              quantity: 1,
            },
          ],
        },
        payment: { create: { status: "APPROVED", amountCents: 100 } },
      },
    });

    const jwt = new JwtTokenService();
    const tokens = new Map([
      [
        buyer.id,
        jwt.sign({
          sub: buyer.id,
          email: buyer.email,
          role: "CUSTOMER",
          isEmailConfirmed: true,
        }),
      ],
      [
        reporter.id,
        jwt.sign({
          sub: reporter.id,
          email: reporter.email,
          role: "STOCK",
          isEmailConfirmed: true,
        }),
      ],
      [
        nonBuyer.id,
        jwt.sign({
          sub: nonBuyer.id,
          email: nonBuyer.email,
          role: "CUSTOMER",
          isEmailConfirmed: true,
        }),
      ],
      [
        admin.id,
        jwt.sign({
          sub: admin.id,
          email: admin.email,
          role: "ADMIN",
          isEmailConfirmed: true,
        }),
      ],
    ]);
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const request = (path, { user, method = "GET", body } = {}) =>
      globalThis.fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(user ? { authorization: `Bearer ${tokens.get(user.id)}` } : {}),
          ...(body ? { "content-type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    const workReviewsPath = `/works/${work.id}/reviews`;

    let response = await request(workReviewsPath);
    assert.equal(response.status, 200);
    let result = await response.json();
    assert.equal(result.averageRating, null);
    assert.equal(result.total, 0);

    response = await request(workReviewsPath, {
      user: buyer,
      method: "POST",
      body: { rating: 5, comment: "Synthetic review" },
    });
    assert.equal(response.status, 201);
    reviewId = (await response.json()).id;

    response = await request(workReviewsPath);
    assert.equal(response.status, 200);
    result = await response.json();
    assert.equal(result.averageRating, 5);
    assert.equal(result.total, 1);
    const catalogBeforeRemoval = await request("/works");
    const catalogBeforeRemovalResult = await catalogBeforeRemoval.json();
    const workBeforeRemoval = catalogBeforeRemovalResult.items.find(
      (item) => item.id === work.id,
    );
    assert.equal(workBeforeRemoval.averageRating, 5);
    assert.equal(workBeforeRemoval.reviewCount, 1);

    response = await request(workReviewsPath, {
      user: nonBuyer,
      method: "POST",
      body: { rating: 4, comment: "Synthetic non-buyer review" },
    });
    assert.equal(response.status, 409);
    response = await request(workReviewsPath, {
      user: buyer,
      method: "POST",
      body: { rating: 5, comment: "Duplicate synthetic review" },
    });
    assert.equal(response.status, 409);

    response = await request(`/reviews/${reviewId}/reports`, {
      user: reporter,
      method: "POST",
      body: { reason: "Synthetic report reason" },
    });
    assert.equal(response.status, 201);
    response = await request(`/reviews/${reviewId}/reports`, {
      user: reporter,
      method: "POST",
      body: { reason: "Duplicate synthetic report" },
    });
    assert.equal(response.status, 409);
    response = await request("/admin/review-reports", { user: nonBuyer });
    assert.equal(response.status, 403);
    response = await request("/admin/review-reports", { user: admin });
    assert.equal(response.status, 200);

    response = await request(`/admin/reviews/${reviewId}`, {
      user: admin,
      method: "DELETE",
      body: {},
    });
    assert.equal(response.status, 400);
    response = await request(`/admin/reviews/${reviewId}`, {
      user: admin,
      method: "DELETE",
      body: { reason: "Synthetic moderation reason" },
    });
    assert.equal(response.status, 200);

    response = await request(workReviewsPath);
    assert.equal(response.status, 200);
    result = await response.json();
    assert.equal(result.total, 0);
    assert.equal(result.averageRating, null);
    const catalogResponse = await request("/works");
    assert.equal(catalogResponse.status, 200);
    const catalogResult = await catalogResponse.json();
    const catalogWork = catalogResult.items.find((item) => item.id === work.id);
    assert.equal(catalogWork.averageRating, null);
    assert.equal(catalogWork.reviewCount, 0);
    const audit = await prisma.auditLog.findFirst({
      where: {
        targetType: "REVIEW",
        targetId: reviewId,
        action: "REVIEW_REMOVED",
      },
    });
    assert.ok(audit);
  } finally {
    if (reviewId) {
      await prisma.reviewReport.deleteMany({ where: { reviewId } });
      await prisma.auditLog.deleteMany({
        where: { targetType: "REVIEW", targetId: reviewId },
      });
      await prisma.review.deleteMany({ where: { id: reviewId } });
    }
    if (work) {
      await prisma.order.deleteMany({ where: { userId: buyer.id } });
      await prisma.work.deleteMany({ where: { id: work.id } });
    }
    if (author) await prisma.author.deleteMany({ where: { id: author.id } });
    if (publisher)
      await prisma.publisher.deleteMany({ where: { id: publisher.id } });
    const userIds = [buyer?.id, reporter?.id, nonBuyer?.id, admin?.id].filter(
      Boolean,
    );
    if (userIds.length)
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    if (baseUrl) await app.close();
    await prisma.$disconnect();
  }
});
