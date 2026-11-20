import assert from "node:assert/strict";
import test from "node:test";
import {
  DownloadLinkTokenService,
  InvalidDownloadLinkError,
} from "../../../apps/api/dist/modules/library/download-link-token.service.js";

const claims = {
  userId: "11111111-1111-4111-8111-111111111111",
  orderItemId: "22222222-2222-4222-8222-222222222222",
  orderId: "33333333-3333-4333-8333-333333333333",
  editionId: "44444444-4444-4444-8444-444444444444",
  assetVersionId: "55555555-5555-4555-8555-555555555555",
  storageKey: `derived/${"a".repeat(64)}.pdf`,
  extension: "pdf",
  mimeType: "application/pdf",
};

test("download-link token encrypts internal paths and rejects tampering", () => {
  const service = new DownloadLinkTokenService();
  const issued = service.issue(claims);
  assert.equal(issued.token.includes("storageKey"), false);
  assert.equal(issued.token.includes(claims.storageKey), false);
  assert.deepEqual(service.verify(issued.token).storageKey, claims.storageKey);
  assert.throws(
    () => service.verify(`${issued.token.slice(0, -1)}x`),
    (error) => error instanceof InvalidDownloadLinkError && error.code === "DOWNLOAD_LINK_INVALID",
  );
});

test("download-link token rejects expired claims", () => {
  const service = new DownloadLinkTokenService();
  const issued = service.issue(claims, Date.now() - 20 * 60 * 1000);
  assert.throws(
    () => service.verify(issued.token),
    (error) => error instanceof InvalidDownloadLinkError && error.code === "DOWNLOAD_LINK_EXPIRED",
  );
});
