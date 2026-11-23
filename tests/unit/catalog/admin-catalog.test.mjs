import assert from "node:assert/strict";
import test from "node:test";
import { CatalogService } from "../../../apps/api/dist/modules/catalog/application/catalog.service.js";

function createUpdateHarness() {
  const calls = {
    editionUpdates: [],
    editionCreates: [],
    editionDeletes: 0,
    workUpdateData: null,
  };
  const saved = {
    id: "work-1",
    title: "Title revised",
    editions: [
      {
        id: "edition-physical",
        format: "PHYSICAL",
        priceCents: 4000,
        isVisible: true,
      },
      {
        id: "edition-digital",
        format: "DIGITAL",
        priceCents: 2000,
        isVisible: true,
      },
    ],
  };
  const tx = {
    author: { upsert: async () => ({ id: "author-1" }) },
    publisher: { upsert: async () => ({ id: "publisher-1" }) },
    category: { upsert: async ({ create }) => ({ id: create.name }) },
    work: {
      update: async ({ data }) => {
        calls.workUpdateData = data;
        return { id: "work-1" };
      },
      findUniqueOrThrow: async () => saved,
    },
    workCategory: { deleteMany: async () => {}, createMany: async () => {} },
    edition: {
      findMany: async () => [
        { id: "edition-physical", format: "PHYSICAL" },
        { id: "edition-digital", format: "DIGITAL" },
      ],
      update: async (args) => calls.editionUpdates.push(args),
      create: async (args) => calls.editionCreates.push(args),
      deleteMany: async () => {
        calls.editionDeletes += 1;
      },
    },
  };
  const prisma = {
    $transaction: async (work) => work(tx),
    review: {
      aggregate: async () => ({ _avg: { rating: null }, _count: { _all: 0 } }),
    },
  };
  return { service: new CatalogService(prisma), calls };
}

test("admin work update keeps edition identities and preserves omitted editions", async () => {
  const { service, calls } = createUpdateHarness();
  await service.upsert(
    {
      title: "Title revised",
      author: "Author",
      publisher: "Publisher",
      synopsis: "Updated synopsis",
      releaseDate: "2026-01-01",
      editions: [
        { format: "PHYSICAL", isbn: "", priceCents: 4500, isVisible: true },
      ],
    },
    "work-1",
  );
  assert.equal(calls.editionUpdates.length, 1);
  assert.equal(calls.editionUpdates[0].where.id, "edition-physical");
  assert.equal(calls.editionUpdates[0].data.priceCents, 4500);
  assert.equal(calls.editionCreates.length, 0);
  assert.equal(calls.editionDeletes, 0);
  assert.equal(Object.hasOwn(calls.workUpdateData, "isVisible"), false);
});

test("admin catalog query scopes hidden works and paginates", async () => {
  let capturedWhere;
  const service = new CatalogService({
    work: {
      findMany: async ({ where, skip, take }) => {
        capturedWhere = where;
        assert.equal(skip, 20);
        assert.equal(take, 20);
        return [];
      },
      count: async () => 0,
    },
  });
  const result = await service.listAdmin({
    search: "hidden title",
    visibility: "hidden",
    page: 2,
    limit: 20,
  });
  assert.equal(capturedWhere.isVisible, false);
  assert.equal(capturedWhere.OR[0].title.contains, "hidden title");
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 0);
});
