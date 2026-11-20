import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { LibraryService } from "../../../apps/api/dist/modules/library/library.service.js";
import { WatermarkProcessingError } from "../../../apps/api/dist/modules/watermark/watermark.service.js";

function createPurchase({ releaseDate = new Date("2026-11-19T00:00:00Z") } = {}) {
  return {
    id: "order-item-synthetic-017",
    format: "DIGITAL",
    order: {
      id: "order-synthetic-017",
      createdAt: new Date("2026-11-18T00:00:00Z"),
      user: { email: "customer@example.invalid" },
    },
    edition: {
      id: "edition-synthetic-017",
      format: "DIGITAL",
      work: { title: "Livro Sintético", releaseDate },
      digitalAsset: {
        versions: [
          {
            id: "asset-version-synthetic-017",
            version: 1,
            storageKey: `original/${"a".repeat(64)}.pdf`,
            mimeType: "application/pdf",
            createdAt: new Date("2026-11-18T00:00:00Z"),
          },
        ],
      },
    },
  };
}

test("library only issues a personalized link for an owned, released digital purchase", async () => {
  const purchase = createPurchase({ releaseDate: new Date("2026-11-21T00:00:00Z") });
  let watermarkCalls = 0;
  const service = new LibraryService(
    { orderItem: { findFirst: async () => purchase } },
    { read: async () => Buffer.from("synthetic original") },
    { personalize: async () => { watermarkCalls += 1; throw new Error("unexpected"); } },
    { issue: () => { throw new Error("unexpected"); } },
    { logAction: async () => {} },
  );

  await assert.rejects(
    service.createDownloadLink("customer-synthetic-017", "edition-synthetic-017", "Customer", new Date("2026-11-20T00:00:00Z")),
    (error) => error instanceof ConflictException && error.getStatus() === 409,
  );
  assert.equal(watermarkCalls, 0);
});

test("library hides an edition that the requesting customer did not purchase", async () => {
  const service = new LibraryService(
    { orderItem: { findFirst: async () => null } },
    { read: async () => { throw new Error("must not read storage"); } },
    { personalize: async () => { throw new Error("must not personalize"); } },
    { issue: () => { throw new Error("must not issue"); } },
    { logAction: async () => {} },
  );

  await assert.rejects(
    service.createDownloadLink("other-customer-synthetic-017", "edition-synthetic-017", "Customer"),
    (error) => error instanceof NotFoundException && error.getStatus() === 404,
  );
});

test("library reports a sanitized audit event when copy processing fails", async () => {
  const purchase = createPurchase();
  const auditEvents = [];
  const service = new LibraryService(
    { orderItem: { findFirst: async () => purchase } },
    { read: async () => Buffer.from("synthetic original") },
    { personalize: async () => { throw new WatermarkProcessingError("INVALID_FILE"); } },
    { issue: () => { throw new Error("must not issue a link"); } },
    { logAction: async (event) => auditEvents.push(event) },
  );

  await assert.rejects(
    service.createDownloadLink("customer-synthetic-017", "edition-synthetic-017", "Synthetic Customer"),
    (error) => error.getStatus() === 500,
  );
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].action, "DIGITAL_COPY_PROCESSING_FAILED");
  assert.equal(auditEvents[0].metadata.errorCode, "INVALID_FILE");
  assert.doesNotMatch(JSON.stringify(auditEvents[0]), /Synthetic Customer|customer@example\.invalid/);
});
