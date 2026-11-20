import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { LocalCustomerSeedService } from "../../../apps/api/dist/modules/identity/application/services/local-customer-seed.service.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

const envKeys = [
  "NODE_ENV",
  "LOCAL_TEST_ACCOUNTS_ENABLED",
  "TEST_CUSTOMER_1_EMAIL",
  "TEST_CUSTOMER_1_PASSWORD",
  "TEST_CUSTOMER_2_EMAIL",
  "TEST_CUSTOMER_2_PASSWORD",
];

const customers = [
  { email: "customer-one@example.invalid", password: "synthetic-password-one" },
  { email: "customer-two@example.invalid", password: "synthetic-password-two" },
];

function configureSeed(values = customers) {
  process.env.NODE_ENV = "development";
  process.env.LOCAL_TEST_ACCOUNTS_ENABLED = "true";
  process.env.TEST_CUSTOMER_1_EMAIL = values[0].email;
  process.env.TEST_CUSTOMER_1_PASSWORD = values[0].password;
  process.env.TEST_CUSTOMER_2_EMAIL = values[1].email;
  process.env.TEST_CUSTOMER_2_PASSWORD = values[1].password;
}

function createHarness(initialUsers = []) {
  const users = new Map(initialUsers.map((user) => [user.email, { ...user }]));
  const calls = { create: [], update: [] };
  const prisma = {
    user: {
      findUnique: async ({ where }) => users.get(where.email) ?? null,
      create: async ({ data }) => {
        calls.create.push(data);
        users.set(data.email, { id: `id-${data.email}`, ...data });
        return users.get(data.email);
      },
      update: async ({ where, data }) => {
        calls.update.push({ where, data });
        const updated = { ...users.get(where.email), ...data };
        users.set(where.email, updated);
        return updated;
      },
    },
  };
  const hasher = { hash: async (password) => `hashed:${password}` };
  return { service: new LocalCustomerSeedService(prisma, hasher), users, calls };
}

test("LocalCustomerSeedService - contas CUSTOMER locais", async (t) => {
  const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of originalEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  await t.test("não executa fora de development ou sem habilitação explícita", async () => {
    configureSeed();
    const { service, calls } = createHarness();
    process.env.NODE_ENV = "production";
    await service.seedCustomers();
    assert.equal(calls.create.length, 0);

    process.env.NODE_ENV = "development";
    process.env.LOCAL_TEST_ACCOUNTS_ENABLED = "false";
    await service.seedCustomers();
    assert.equal(calls.create.length, 0);
  });

  await t.test("exige duas contas sintéticas distintas e completas", async () => {
    configureSeed([
      customers[0],
      { ...customers[1], email: "customer-two@example.com" },
    ]);
    const { service, calls } = createHarness();
    await assert.rejects(service.seedCustomers(), /@example\.invalid/);
    assert.equal(calls.create.length, 0);

    configureSeed([customers[0], { ...customers[1], email: customers[0].email }]);
    await assert.rejects(service.seedCustomers(), /distinct customer emails/);
    assert.equal(calls.create.length, 0);
  });

  await t.test("cria e atualiza as contas com hash, confirmação e papel CUSTOMER", async () => {
    configureSeed([
      { ...customers[0], email: " CUSTOMER-ONE@EXAMPLE.INVALID " },
      customers[1],
    ]);
    const { service, users, calls } = createHarness([
      {
        id: "existing-customer",
        email: "customer-one@example.invalid",
        role: Role.CUSTOMER,
        isEmailConfirmed: false,
        isActive: false,
        deactivatedAt: new Date(),
        scheduledDeletionAt: new Date(),
      },
    ]);

    await service.seedCustomers();

    assert.equal(calls.create.length, 1);
    assert.equal(calls.update.length, 1);
    assert.equal(users.get("customer-one@example.invalid").passwordHash, "hashed:synthetic-password-one");
    assert.equal(users.get("customer-one@example.invalid").isEmailConfirmed, true);
    assert.equal(users.get("customer-one@example.invalid").isActive, true);
    assert.equal(users.get("customer-one@example.invalid").deactivatedAt, null);
    assert.equal(users.get("customer-one@example.invalid").scheduledDeletionAt, null);
    assert.equal(users.get("customer-two@example.invalid").role, Role.CUSTOMER);
    assert.equal(users.get("customer-two@example.invalid").passwordHash, "hashed:synthetic-password-two");
    assert.equal(calls.create[0].role, Role.CUSTOMER);
    assert.equal(calls.create[0].isEmailConfirmed, true);
    assert.equal(calls.create[0].passwordHash, "hashed:synthetic-password-two");
    assert.notEqual(calls.create[0].passwordHash, customers[1].password);

    await service.seedCustomers();
    assert.equal(calls.create.length, 1);
    assert.equal(calls.update.length, 3);
  });

  await t.test("recusa reutilizar endereço configurado com outro papel", async () => {
    configureSeed();
    const { service, calls } = createHarness([
      { email: customers[0].email, role: Role.ADMIN },
    ]);
    await assert.rejects(service.seedCustomers(), /non-customer role/);
    assert.equal(calls.update.length, 0);
    assert.equal(calls.create.length, 0);
  });
});
