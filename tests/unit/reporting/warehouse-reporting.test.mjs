import assert from "node:assert/strict";
import test from "node:test";
import { WarehouseReportingService } from "../../../apps/api/dist/modules/reporting/warehouse/warehouse-reporting.service.js";

test("warehouse summary reports physical fulfillment counts and zero-stock alerts", async () => {
  const prisma = {
    edition: {
      findMany: async () => [
        { id: "edition-zero", inventory: { physicalStock: 0 }, work: { title: "Synthetic zero" } },
        { id: "edition-stock", inventory: { physicalStock: 4 }, work: { title: "Synthetic stock" } },
        { id: "edition-missing", inventory: null, work: { title: "Synthetic missing" } },
      ],
    },
    order: {
      count: async ({ where }) => ({ PENDING: 2, PICKING: 1, SHIPPED: 3, DELIVERED: 5 })[where.fulfillmentStatus],
    },
  };
  const service = new WarehouseReportingService(prisma);

  const result = await service.summary();

  assert.deepEqual(result.orders, { pending: 2, picking: 1, shipped: 3, delivered: 5 });
  assert.deepEqual(result.inventory, { editionCount: 3, totalUnits: 4, outOfStockCount: 2 });
  assert.deepEqual(result.alerts, [
    { editionId: "edition-zero", workTitle: "Synthetic zero", physicalStock: 0, type: "OUT_OF_STOCK" },
    { editionId: "edition-missing", workTitle: "Synthetic missing", physicalStock: null, type: "INVENTORY_NOT_CONFIGURED" },
  ]);
});
