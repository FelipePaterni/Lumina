import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../../apps/api/dist/app.module.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

test("TASK-024 observability dashboard is Admin-only and returns aggregate data without PII", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const jwt = new JwtTokenService();
  const tokens = Object.fromEntries(["ADMIN", "CATALOG", "STOCK", "CUSTOMER"].map((role) => [
    role,
    jwt.sign({
      sub: `task024-${role.toLowerCase()}`,
      email: `task024-${role.toLowerCase()}@example.invalid`,
      role,
      isEmailConfirmed: true,
    }),
  ]));
  let baseUrl;
  let fixtureEmails = [];

  try {
    await prisma.$connect();
    const futureEmail = `task024-future-${suffix}@example.invalid`;
    const expiredEmail = `task024-expired-${suffix}@example.invalid`;
    fixtureEmails = [futureEmail, expiredEmail];
    await prisma.user.createMany({
      data: [
        {
          email: futureEmail,
          passwordHash: "synthetic-only",
          role: "CUSTOMER",
          isActive: false,
          deactivatedAt: new Date(),
          scheduledDeletionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          email: expiredEmail,
          passwordHash: "synthetic-only",
          role: "CUSTOMER",
          isActive: false,
          deactivatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          scheduledDeletionAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const route = `${baseUrl}/admin/observability/dashboard`;
    const request = (role) => globalThis.fetch(route, {
      headers: role ? { authorization: `Bearer ${tokens[role]}` } : {},
    });

    const adminResponse = await request("ADMIN");
    assert.equal(adminResponse.status, 200);
    const payload = await adminResponse.json();
    assert.deepEqual(payload.health, { api: "UP", database: "UP" });
    for (const status of ["PENDING", "PROCESSING", "RETRY", "SENT", "FAILED"]) {
      assert.equal(typeof payload.notifications[status], "number");
    }
    assert.ok(payload.accountDeletion.pendingRequests >= 1);
    assert.ok(payload.accountDeletion.expiredRequests >= 1);
    assert.equal(typeof payload.alerts.failedNotifications, "number");
    assert.equal(typeof payload.alerts.expiredProcessingLeases, "number");
    assert.doesNotMatch(JSON.stringify(payload), /task024-|example\.invalid|email|userId|targetId|reason|subject|body/i);

    const denied = await Promise.all([
      request("CATALOG"),
      request("STOCK"),
      request("CUSTOMER"),
      request(undefined),
    ]);
    assert.deepEqual(denied.map((response) => response.status), [403, 403, 403, 401]);
  } finally {
    if (fixtureEmails.length) await prisma.user.deleteMany({ where: { email: { in: fixtureEmails } } });
    await app.close();
    await prisma.$disconnect();
  }
});
