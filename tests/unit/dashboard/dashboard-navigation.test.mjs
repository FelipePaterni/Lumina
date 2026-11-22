import assert from "node:assert/strict";
import test from "node:test";
import {
  dashboardSectionRoutes,
  dashboardSectionsForRole,
  landingRouteForRole,
} from "../../../apps/web/src/features/dashboard/dashboard-navigation.ts";

test("team dashboard sections map to registered web routes", () => {
  assert.deepEqual(dashboardSectionRoutes, {
    admin: "/dashboard",
    catalog: "/catalog/dashboard",
    warehouse: "/warehouse/dashboard",
    operations: "/operations/dashboard",
  });
});

test("role landing routes only expose the assigned dashboard", () => {
  assert.equal(landingRouteForRole("ADMIN"), "/dashboard");
  assert.equal(landingRouteForRole("CATALOG"), "/catalog/dashboard");
  assert.equal(landingRouteForRole("STOCK"), "/warehouse/dashboard");

  assert.deepEqual(dashboardSectionsForRole.ADMIN, ["admin", "catalog", "warehouse", "operations"]);
  assert.deepEqual(dashboardSectionsForRole.CATALOG, ["catalog"]);
  assert.deepEqual(dashboardSectionsForRole.STOCK, ["warehouse"]);
});
