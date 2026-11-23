import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import "reflect-metadata";
import { UserManagementController } from "../../../apps/api/dist/modules/identity/presentation/user-management.controller.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";
import { AdminCatalogController } from "../../../apps/api/dist/modules/catalog/presentation/admin-catalog.controller.js";
import { AdminInventoryController } from "../../../apps/api/dist/modules/inventory/admin-inventory.controller.js";

test("admin invitation returns a one-time activation link and records the reason without token metadata", async () => {
  const calls = { invitation: null, audit: null };
  const controller = new UserManagementController(
    { listUsers: async (filters) => filters },
    {
      createStaffInvitation: async (data) => {
        calls.invitation = data;
        return {
          userId: "synthetic-user",
          email: data.email,
          role: data.role,
          token: "one-time-token",
        };
      },
    },
    {
      logAction: async (audit) => {
        calls.audit = audit;
      },
    },
  );
  const oldBase = process.env.WEB_BASE_URL;
  process.env.WEB_BASE_URL = "http://web.example.invalid/";
  try {
    const response = await controller.createInvitation(
      {
        email: "staff@example.invalid",
        role: Role.CATALOG,
        reason: "Synthetic onboarding",
      },
      { user: { sub: "admin-synthetic", role: Role.ADMIN } },
    );
    assert.equal(calls.invitation.role, Role.CATALOG);
    assert.equal(
      response.activationUrl,
      "http://web.example.invalid/ativar-equipe?token=one-time-token",
    );
    assert.equal(response.expiresInHours, 24);
    assert.equal(calls.audit.action, "TEAM_INVITATION_CREATED");
    assert.equal(calls.audit.reason, "Synthetic onboarding");
    assert.equal(JSON.stringify(calls.audit.metadata).includes("token"), false);
  } finally {
    if (oldBase === undefined) delete process.env.WEB_BASE_URL;
    else process.env.WEB_BASE_URL = oldBase;
  }
});

test("admin list parses filters and enforces expected controller roles", async () => {
  const controller = new UserManagementController(
    { listUsers: async (filters) => filters },
    {},
    {},
  );
  const filters = await controller.listUsers(
    "2",
    "10",
    Role.STOCK,
    "staff",
    "false",
  );
  assert.deepEqual(filters, {
    page: 2,
    limit: 10,
    role: Role.STOCK,
    search: "staff",
    isActive: false,
  });
  assert.deepEqual(Reflect.getMetadata("roles", UserManagementController), [
    Role.ADMIN,
  ]);
  assert.deepEqual(Reflect.getMetadata("roles", AdminCatalogController), [
    Role.ADMIN,
    Role.CATALOG,
  ]);
  assert.deepEqual(Reflect.getMetadata("roles", AdminInventoryController), [
    Role.ADMIN,
    Role.STOCK,
  ]);
});
