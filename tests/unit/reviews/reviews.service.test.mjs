import assert from "node:assert/strict";
import test from "node:test";
import { ReviewsService } from "../../../apps/api/dist/modules/reviews/reviews.service.js";

function createHarness() {
  const work = { id: "work-1" };
  const calls = {};
  const review = {
    id: "review-1",
    workId: work.id,
    userId: "buyer-1",
    rating: 5,
    comment: "Synthetic review",
    isVisible: true,
  };
  const tx = {
    review: {
      findUnique: async () => review,
      update: async () => ({
        id: review.id,
        isVisible: false,
        moderatedAt: new Date(),
      }),
    },
    reviewReport: { updateMany: async () => ({ count: 1 }) },
    auditLog: { create: async () => ({}) },
  };
  const prisma = {
    work: { findFirst: async () => work },
    orderItem: {
      findMany: async (args) => {
        calls.purchaseQuery = args;
        return [{ quantity: 1, refunds: [] }];
      },
    },
    review: {
      create: async ({ data }) => ({ id: "review-2", ...data }),
      findMany: async () => [{ id: review.id }],
      count: async () => 1,
      aggregate: async () => ({ _avg: { rating: 4 }, _count: { _all: 1 } }),
    },
    reviewReport: {
      create: async ({ data }) => ({ id: "report-1", ...data }),
      findMany: async () => [],
    },
    $transaction: async (callback) => callback(tx),
  };
  const audit = { logActionInTransaction: async () => {} };
  return {
    service: new ReviewsService(prisma, audit),
    prisma,
    tx,
    audit,
    review,
    calls,
  };
}

test("reviews are created immediately for a confirmed buyer", async () => {
  const { service, calls } = createHarness();
  const result = await service.createReview(
    "buyer-1",
    true,
    "work-1",
    5,
    "  Synthetic review  ",
  );

  assert.deepEqual(result, {
    id: "review-2",
    userId: "buyer-1",
    workId: "work-1",
    rating: 5,
    comment: "Synthetic review",
  });
  assert.equal(calls.purchaseQuery.where.edition.workId, "work-1");
  assert.deepEqual(calls.purchaseQuery.where.order.status.in, [
    "CONFIRMED",
    "PARTIALLY_REFUNDED",
  ]);
});

test("reviews reject a user without an unrefunded acquisition", async () => {
  const { service, prisma } = createHarness();
  prisma.orderItem.findMany = async () => [
    { quantity: 1, refunds: [{ quantity: 1 }] },
  ];

  await assert.rejects(
    service.createReview("buyer-1", true, "work-1", 5, "Synthetic review"),
    (error) => error.getStatus() === 409,
  );
});

test("reviews require a confirmed email and rating from one to five", async () => {
  const { service } = createHarness();

  await assert.rejects(
    service.createReview("buyer-1", false, "work-1", 5, "Synthetic review"),
    (error) => error.getStatus() === 400,
  );
  await assert.rejects(
    service.createReview("buyer-1", true, "work-1", 6, "Synthetic review"),
    (error) => error.getStatus() === 400,
  );
});

test("public review results and average use visible reviews only", async () => {
  const { service, prisma } = createHarness();
  prisma.review.findMany = async (args) => {
    assert.equal(args.where.isVisible, true);
    return [{ id: "review-1" }];
  };
  prisma.review.aggregate = async (args) => {
    assert.equal(args.where.isVisible, true);
    return { _avg: { rating: 4.5 } };
  };

  const result = await service.listForWork("work-1");
  assert.equal(result.averageRating, 4.5);
  assert.equal(result.total, 1);
});

test("report creation validates the reason", async () => {
  const { service } = createHarness();

  await assert.rejects(
    service.reportReview("reporter-1", "review-1", "no"),
    (error) => error.getStatus() === 400,
  );
});

test("admin removal hides a review and audits it in the same transaction", async () => {
  const { service, tx, audit } = createHarness();
  let auditCalled = false;
  audit.logActionInTransaction = async (actualTx, params) => {
    assert.equal(actualTx, tx);
    assert.equal(params.action, "REVIEW_REMOVED");
    assert.equal(params.reason, "Synthetic moderation reason");
    auditCalled = true;
  };
  let reportsActioned = false;
  tx.reviewReport.updateMany = async ({ where, data }) => {
    assert.deepEqual(where, { reviewId: "review-1", status: "OPEN" });
    assert.deepEqual(data, { status: "ACTIONED" });
    reportsActioned = true;
  };

  const result = await service.removeReview(
    "review-1",
    "admin-1",
    "Synthetic moderation reason",
  );
  assert.equal(result.isVisible, false);
  assert.equal(auditCalled, true);
  assert.equal(reportsActioned, true);
});
