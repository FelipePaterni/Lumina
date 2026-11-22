import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

test("TASK-023 dashboards enforce role isolation and return aggregate-only payloads", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  const app = await NestFactory.create(AppModule, { logger: false });
  const jwt = new JwtTokenService();
  const tokenFor = (role) => jwt.sign({
    sub: `task023-${role.toLowerCase()}`,
    email: `task023-${role.toLowerCase()}@example.invalid`,
    role,
    isEmailConfirmed: true,
  });
  const tokens = {
    ADMIN: tokenFor("ADMIN"),
    CATALOG: tokenFor("CATALOG"),
    STOCK: tokenFor("STOCK"),
    CUSTOMER: tokenFor("CUSTOMER"),
  };
  let baseUrl;

  try {
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const request = async (path, role) => globalThis.fetch(`${baseUrl}${path}`, {
      headers: role ? { authorization: `Bearer ${tokens[role]}` } : {},
    });
    const readJson = async (response) => response.json();
    const routes = [
      "/admin/dashboard",
      "/catalog/dashboard",
      "/warehouse/dashboard",
    ];

    const adminResponses = await Promise.all(routes.map((route) => request(route, "ADMIN")));
    assert.deepEqual(adminResponses.map((response) => response.status), [200, 200, 200]);
    const adminPayload = await readJson(adminResponses[0]);
    assert.equal(typeof adminPayload.netSalesCents, "number");
    assert.equal(typeof adminPayload.activeCustomers, "number");
    assert.equal(typeof adminPayload.confirmedOrders, "number");
    assert.ok(Array.isArray(adminPayload.bestsellers));
    assert.ok(adminPayload.bestsellers.length <= 5);
    assert.doesNotMatch(JSON.stringify(adminPayload), /"(?:email|phone|postalCode|recipientName)"\s*:/i);

    const catalogResponse = await request("/catalog/dashboard", "CATALOG");
    assert.equal(catalogResponse.status, 200);
    const catalogPayload = await readJson(catalogResponse);
    assert.equal(typeof catalogPayload.licenses.finiteAvailable, "number");
    assert.ok(Array.isArray(catalogPayload.licenses.exhausted));
    assert.equal(typeof catalogPayload.coupons.remainingUses, "number");
    assert.doesNotMatch(JSON.stringify(catalogPayload), /"(?:email|phone|postalCode|recipientName|code)"\s*:/i);

    const stockResponse = await request("/warehouse/dashboard", "STOCK");
    const oldStockResponse = await request("/admin/warehouse/summary", "STOCK");
    assert.equal(stockResponse.status, 200);
    assert.deepEqual(await readJson(stockResponse), await readJson(oldStockResponse));

    const denied = await Promise.all([
      ...routes.map((route) => request(route, "CUSTOMER")),
      request("/admin/dashboard", "CATALOG"),
      request("/warehouse/dashboard", "CATALOG"),
      request("/admin/dashboard", "STOCK"),
      request("/catalog/dashboard", "STOCK"),
    ]);
    assert.ok(denied.every((response) => response.status === 403));

    const anonymous = await Promise.all(routes.map((route) => request(route)));
    assert.ok(anonymous.every((response) => response.status === 401));
  } finally {
    await app.close();
  }
});
