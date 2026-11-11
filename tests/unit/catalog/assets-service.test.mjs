import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";
import { AssetsService } from "../../../apps/api/dist/modules/catalog/assets/assets.service.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

function createHarness({ format = "DIGITAL", latestVersion = null } = {}) {
  const calls = { storage: [], audit: [], createVersion: 0 };
  const prisma = {
    edition: {
      findUnique: async () => ({ id: "edition-synthetic", format }),
    },
    digitalAsset: {
      upsert: async () => ({ id: "asset-synthetic" }),
      findUnique: async () => ({
        id: "asset-synthetic",
        versions: latestVersion ? [latestVersion] : [],
      }),
    },
    digitalAssetVersion: {
      findFirst: async () => latestVersion,
      create: async ({ data }) => {
        calls.createVersion += 1;
        return { id: "version-synthetic", ...data };
      },
    },
  };
  const storage = {
    put: async (...args) => {
      calls.storage.push(args);
      return {
        storageKey: "original/synthetic-checksum.txt",
        checksum: "synthetic-checksum",
      };
    },
  };
  const audit = {
    logAction: async (entry) => calls.audit.push(entry),
  };
  return { service: new AssetsService(prisma, storage, audit), calls };
}

test("asset version stores synthetic content privately and omits storage details", async () => {
  const { service, calls } = createHarness();
  const content = Buffer.from("synthetic private content");
  const result = await service.addVersion(
    "edition-synthetic",
    {
      contentBase64: content.toString("base64"),
      extension: "txt",
      mimeType: "text/plain",
      isOriginal: true,
      reason: "Synthetic test reason",
    },
    "actor-synthetic",
    Role.ADMIN,
  );

  assert.equal(result.version, 1);
  assert.equal(result.checksum, "synthetic-checksum");
  assert.equal(result.isOriginal, true);
  assert.equal("storageKey" in result, false);
  assert.equal("contentBase64" in result, false);
  assert.deepEqual(calls.storage[0], ["original", content, "txt"]);
  assert.equal(calls.audit[0].action, "DIGITAL_ASSET_VERSION_CREATED");
});

test("asset version rejects malformed base64 before storage or audit", async () => {
  const { service, calls } = createHarness();

  await assert.rejects(
    service.addVersion(
      "edition-synthetic",
      {
        contentBase64: "not-base64$$",
        extension: "txt",
        mimeType: "text/plain",
        reason: "Synthetic test reason",
      },
      "actor-synthetic",
      Role.ADMIN,
    ),
    (error) => error.getStatus() === 400,
  );

  assert.equal(calls.storage.length, 0);
  assert.equal(calls.createVersion, 0);
  assert.equal(calls.audit.length, 0);
});

test("asset version rejects a non-digital edition", async () => {
  const { service, calls } = createHarness({ format: "PHYSICAL" });

  await assert.rejects(
    service.addVersion(
      "edition-synthetic",
      {
        contentBase64: Buffer.from("synthetic").toString("base64"),
        extension: "txt",
        mimeType: "text/plain",
        reason: "Synthetic test reason",
      },
      "actor-synthetic",
      Role.ADMIN,
    ),
    (error) => error.getStatus() === 404,
  );

  assert.equal(calls.storage.length, 0);
  assert.equal(calls.createVersion, 0);
  assert.equal(calls.audit.length, 0);
});
