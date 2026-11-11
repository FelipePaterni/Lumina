import assert from "node:assert/strict";
import test from "node:test";
import { InventoryService } from "../../../apps/api/dist/modules/inventory/inventory.service.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

function createHarness({ format, digitalAllocated = 0 }) {
  const calls = { upsert: 0, movement: 0, audit: [] };
  const inventory = {
    id: "inventory-synthetic",
    editionId: "edition-synthetic",
    physicalStock: 0,
    digitalLicenseLimit: null,
    digitalAllocated,
  };
  const tx = {
    edition: {
      findUnique: async () => ({ id: "edition-synthetic", format }),
    },
    inventory: {
      upsert: async ({ update }) => {
        calls.upsert += 1;
        Object.assign(inventory, update);
        return inventory;
      },
    },
    inventoryMovement: {
      create: async () => {
        calls.movement += 1;
      },
    },
  };
  const prisma = {
    $transaction: async (operation) => operation(tx),
  };
  const audit = {
    logAction: async (entry) => calls.audit.push(entry),
  };
  return { service: new InventoryService(prisma, audit), calls, inventory };
}

test("physical adjustment updates stock, records movement, and audits", async () => {
  const { service, calls, inventory } = createHarness({ format: "PHYSICAL" });

  const result = await service.adjustPhysical(
    "edition-synthetic",
    5,
    "Synthetic test reason",
    "actor-synthetic",
    Role.ADMIN,
  );

  assert.equal(result.physicalStock, 5);
  assert.equal(inventory.physicalStock, 5);
  assert.equal(calls.movement, 1);
  assert.equal(calls.audit[0].action, "INVENTORY_PHYSICAL_ADJUSTED");
});

test("physical adjustment rejects a digital edition before writing", async () => {
  const { service, calls } = createHarness({ format: "DIGITAL" });

  await assert.rejects(
    service.adjustPhysical(
      "edition-synthetic",
      5,
      "Synthetic test reason",
      "actor-synthetic",
      Role.ADMIN,
    ),
    (error) => error.getStatus() === 400,
  );

  assert.equal(calls.upsert, 0);
  assert.equal(calls.movement, 0);
  assert.equal(calls.audit.length, 0);
});

test("physical adjustment rejects negative and fractional stock", async () => {
  const { service, calls } = createHarness({ format: "PHYSICAL" });

  for (const stock of [-1, 1.5]) {
    await assert.rejects(
      service.adjustPhysical(
        "edition-synthetic",
        stock,
        "Synthetic test reason",
        "actor-synthetic",
        Role.ADMIN,
      ),
      (error) => error.getStatus() === 400,
    );
  }

  assert.equal(calls.upsert, 0);
  assert.equal(calls.movement, 0);
  assert.equal(calls.audit.length, 0);
});

test("digital limit accepts finite and unlimited values with audit", async () => {
  const { service, calls, inventory } = createHarness({ format: "DIGITAL" });

  await service.setDigitalLimit(
    "edition-synthetic",
    10,
    "Synthetic test reason",
    "actor-synthetic",
    Role.ADMIN,
  );
  await service.setDigitalLimit(
    "edition-synthetic",
    null,
    "Synthetic test reason",
    "actor-synthetic",
    Role.ADMIN,
  );

  assert.equal(inventory.digitalLicenseLimit, null);
  assert.deepEqual(
    calls.audit.map((entry) => entry.action),
    ["INVENTORY_DIGITAL_LIMIT_CHANGED", "INVENTORY_DIGITAL_LIMIT_CHANGED"],
  );
});

test("digital limit rejects a physical edition before writing", async () => {
  const { service, calls } = createHarness({ format: "PHYSICAL" });

  await assert.rejects(
    service.setDigitalLimit(
      "edition-synthetic",
      10,
      "Synthetic test reason",
      "actor-synthetic",
      Role.ADMIN,
    ),
    (error) => error.getStatus() === 400,
  );

  assert.equal(calls.upsert, 0);
  assert.equal(calls.audit.length, 0);
});

test("digital limit rejects invalid or below-allocated limits", async () => {
  const { service, calls } = createHarness({
    format: "DIGITAL",
    digitalAllocated: 3,
  });

  for (const limit of [-1, 2]) {
    await assert.rejects(
      service.setDigitalLimit(
        "edition-synthetic",
        limit,
        "Synthetic test reason",
        "actor-synthetic",
        Role.ADMIN,
      ),
      (error) => error.getStatus() === 400,
    );
  }

  assert.equal(calls.audit.length, 0);
});
