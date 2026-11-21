import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { LibraryService } from "../../../apps/api/dist/modules/library/library.service.js";

test("a previously issued digital link stops working after its purchase is refunded", async () => {
  const purchase = {
    id: "order-item-synthetic-task020",
    format: "DIGITAL",
    order: {
      id: "order-synthetic-task020",
      createdAt: new Date("2026-11-20T00:00:00Z"),
      user: { email: "customer@example.invalid" },
    },
    edition: {
      id: "edition-synthetic-task020",
      format: "DIGITAL",
      work: {
        title: "Livro sintético TASK-020",
        releaseDate: new Date("2026-11-19T00:00:00Z"),
      },
      digitalAsset: {
        versions: [{
          id: "asset-version-synthetic-task020",
          version: 1,
          storageKey: `original/${"a".repeat(64)}.pdf`,
          mimeType: "application/pdf",
          createdAt: new Date("2026-11-20T00:00:00Z"),
        }],
      },
    },
  };
  let entitlementChecks = 0;
  let derivedReads = 0;
  const issuedAt = new Date("2026-11-21T12:00:00Z");
  const service = new LibraryService(
    {
      orderItem: {
        findFirst: async () => {
          entitlementChecks += 1;
          return entitlementChecks === 1 ? purchase : null;
        },
      },
    },
    {
      read: async (scope) => {
        if (scope === "derived") derivedReads += 1;
        return Buffer.from("synthetic original");
      },
      put: async () => ({ storageKey: `derived/${"b".repeat(64)}.pdf` }),
    },
    {
      personalize: async () => ({
        content: Buffer.from("synthetic personalized copy"),
        extension: "pdf",
        mimeType: "application/pdf",
      }),
    },
    {
      issue: () => ({ token: "synthetic-task020-token", expiresAt: new Date(issuedAt.getTime() + 900_000) }),
      verify: () => ({
        userId: "customer-synthetic-task020",
        orderItemId: purchase.id,
        orderId: purchase.order.id,
        editionId: purchase.edition.id,
        assetVersionId: "asset-version-synthetic-task020",
        storageKey: `derived/${"b".repeat(64)}.pdf`,
        extension: "pdf",
        mimeType: "application/pdf",
      }),
    },
    { logAction: async () => {} },
  );

  const issued = await service.createDownloadLink(
    "customer-synthetic-task020",
    purchase.edition.id,
    "Cliente Sintético",
    issuedAt,
  );
  assert.equal(issued.downloadUrl, "/library/download/synthetic-task020-token");

  await assert.rejects(
    service.download("synthetic-task020-token"),
    (error) => error instanceof NotFoundException && error.getStatus() === 404,
  );
  assert.equal(entitlementChecks, 2);
  assert.equal(derivedReads, 0);
});
