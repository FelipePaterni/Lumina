import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { PrivateLocalStorage } from "../../../apps/api/dist/storage/private-local.storage.js";

test("private local storage reads only hash keys from the requested private scope", async () => {
  const root = await mkdtemp(join(tmpdir(), "lumina-private-storage-"));
  const priorRoot = process.env.PRIVATE_STORAGE_ROOT;
  process.env.PRIVATE_STORAGE_ROOT = root;
  try {
    const storage = new PrivateLocalStorage();
    const original = Buffer.from("synthetic private original");
    const stored = await storage.put("original", original, "pdf");

    assert.deepEqual(await storage.read("original", stored.storageKey), original);
    await assert.rejects(storage.read("derived", stored.storageKey));
    await assert.rejects(storage.read("original", "original/../secret.pdf"));
    await assert.rejects(storage.read("original", "derived/../../secret.pdf"));
  } finally {
    if (priorRoot === undefined) delete process.env.PRIVATE_STORAGE_ROOT;
    else process.env.PRIVATE_STORAGE_ROOT = priorRoot;
    await rm(root, { recursive: true, force: true });
  }
});
