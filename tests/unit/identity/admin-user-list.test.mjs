import assert from "node:assert/strict";
import test from "node:test";
import { AccountService } from "../../../apps/api/dist/modules/identity/application/services/account.service.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

test("admin user list combines email, role and status filters with bounded pagination", async () => {
  let listArgs;
  let countWhere;
  const prisma = {
    user: {
      findMany: async (args) => {
        listArgs = args;
        return [];
      },
      count: async ({ where }) => {
        countWhere = where;
        return 201;
      },
    },
  };
  const service = new AccountService(prisma, {});
  const result = await service.listUsers({
    page: 2,
    limit: 250,
    role: Role.STOCK,
    search: " ops@example.invalid ",
    isActive: false,
  });
  assert.equal(listArgs.skip, 100);
  assert.equal(listArgs.take, 100);
  assert.equal(listArgs.where.role, Role.STOCK);
  assert.equal(listArgs.where.email.contains, "ops@example.invalid");
  assert.equal(listArgs.where.isActive, false);
  assert.deepEqual(countWhere, listArgs.where);
  assert.equal(result.totalPages, 3);
});
