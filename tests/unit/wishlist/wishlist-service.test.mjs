import assert from "node:assert/strict";
import test from "node:test";
import { WishlistService } from "../../../apps/api/dist/modules/wishlist/wishlist.service.js";

function createHarness() {
  const entries = [];
  const prisma = {
    work: {
      findFirst: async ({ where }) =>
        where.id === "hidden-work" ? null : { id: where.id },
    },
    wishlistItem: {
      findMany: async ({ where }) =>
        entries.filter(
          (entry) => entry.userId === where.userId && entry.work.isVisible,
        ),
      create: async ({ data }) => {
        if (
          entries.some(
            (entry) =>
              entry.userId === data.userId && entry.workId === data.workId,
          )
        ) {
          const error = new Error("unique constraint");
          error.code = "P2002";
          throw error;
        }
        const entry = {
          id: `entry-${entries.length + 1}`,
          ...data,
          createdAt: new Date(),
          work: { id: data.workId, title: "Synthetic work", isVisible: true },
        };
        entries.push(entry);
        return entry;
      },
      deleteMany: async ({ where }) => {
        const index = entries.findIndex(
          (entry) =>
            entry.userId === where.userId && entry.workId === where.workId,
        );
        if (index < 0) return { count: 0 };
        entries.splice(index, 1);
        return { count: 1 };
      },
    },
  };
  return { service: new WishlistService(prisma), entries };
}

test("wishlist lists only the requesting customer's visible items", async () => {
  const { service } = createHarness();
  await service.add("customer-a", "work-a");
  await service.add("customer-b", "work-b");

  const result = await service.list("customer-a");
  assert.equal(result.length, 1);
  assert.equal(result[0].userId, "customer-a");
});

test("wishlist refuses a duplicate item", async () => {
  const { service } = createHarness();
  await service.add("customer-a", "work-a");

  await assert.rejects(
    service.add("customer-a", "work-a"),
    (error) => error.getStatus() === 409,
  );
});

test("wishlist cannot remove another customer's item", async () => {
  const { service, entries } = createHarness();
  await service.add("customer-a", "work-a");

  await assert.rejects(
    service.remove("customer-b", "work-a"),
    (error) => error.getStatus() === 404,
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].userId, "customer-a");
});

test("wishlist requires a visible existing work to add", async () => {
  const { service, entries } = createHarness();

  await assert.rejects(
    service.add("customer-a", "hidden-work"),
    (error) => error.getStatus() === 404,
  );
  assert.equal(entries.length, 0);
});
