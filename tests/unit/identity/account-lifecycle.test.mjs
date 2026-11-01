import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";
import { AccountService } from "../../../apps/api/dist/modules/identity/application/services/account.service.js";

// Mock minimal do Prisma para testar isoladamente as regras do ciclo de desativação/reativação
class MockPrisma {
  constructor() {
    this.userDb = new Map();
  }

  user = {
    findUnique: async ({ where }) => this.userDb.get(where.id) || null,
    update: async ({ where, data }) => {
      const existing = this.userDb.get(where.id);
      const updated = { ...existing, ...data };
      this.userDb.set(where.id, updated);
      return updated;
    },
    count: async () => 1,
  };
}

class MockEmailDispatcher {
  constructor() {
    this.dispatched = [];
  }

  async dispatchSimulatedEmail(toEmail, subject, body) {
    this.dispatched.push({ toEmail, subject, body });
  }
}

test("Account Lifecycle - solicitação de desativação define carência de 30 dias (RN-018)", async () => {
  const prisma = new MockPrisma();
  const emailDispatcher = new MockEmailDispatcher();

  const userId = "customer-1";
  prisma.userDb.set(userId, {
    id: userId,
    email: "cliente@teste.local",
    role: Role.CUSTOMER,
    isActive: true,
  });

  const accountService = new AccountService(prisma, emailDispatcher);
  const result = await accountService.requestAccountDeletion(userId, "Não quero mais comprar");

  const afterUser = prisma.userDb.get(userId);
  assert.equal(afterUser.isActive, false);
  assert.ok(result.deactivatedAt instanceof Date);
  assert.ok(result.scheduledDeletionAt instanceof Date);

  // A janela de carência deve ser aproximadamente 30 dias à frente
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const diff = result.scheduledDeletionAt.getTime() - result.deactivatedAt.getTime();
  assert.equal(Math.round(diff / 1000), Math.round(thirtyDaysMs / 1000));

  // Duas notificações devem ser emitidas: uma ao cliente e uma ao admin (RN-018 / RN-019)
  assert.equal(emailDispatcher.dispatched.length, 2);
  assert.equal(emailDispatcher.dispatched[0].toEmail, "cliente@teste.local");
});

test("Account Lifecycle - reativação limpa datas e reativa a conta dentro do prazo (RN-018)", async () => {
  const prisma = new MockPrisma();
  const emailDispatcher = new MockEmailDispatcher();

  const userId = "customer-2";
  const now = new Date();
  prisma.userDb.set(userId, {
    id: userId,
    email: "cliente2@teste.local",
    role: Role.CUSTOMER,
    isActive: false,
    deactivatedAt: now,
    scheduledDeletionAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // ainda faltam 15 dias
  });

  const accountService = new AccountService(prisma, emailDispatcher);
  const result = await accountService.reactivateAccount(userId);

  assert.equal(result.isActive, true);
  const afterUser = prisma.userDb.get(userId);
  assert.equal(afterUser.isActive, true);
  assert.equal(afterUser.deactivatedAt, null);
  assert.equal(afterUser.scheduledDeletionAt, null);

  // Notificação de reativação enviada
  assert.equal(emailDispatcher.dispatched.length, 1);
  assert.equal(emailDispatcher.dispatched[0].toEmail, "cliente2@teste.local");
});

test("Account Lifecycle - impede reativação após o prazo de 30 dias expirado", async () => {
  const prisma = new MockPrisma();
  const emailDispatcher = new MockEmailDispatcher();

  const userId = "customer-3";
  const past = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 dias atrás
  prisma.userDb.set(userId, {
    id: userId,
    email: "cliente3@teste.local",
    role: Role.CUSTOMER,
    isActive: false,
    deactivatedAt: past,
    scheduledDeletionAt: new Date(past.getTime() + 30 * 24 * 60 * 60 * 1000), // expirou há 5 dias
  });

  const accountService = new AccountService(prisma, emailDispatcher);
  await assert.rejects(
    () => accountService.reactivateAccount(userId),
    /O prazo de 30 dias para reativação expirou/,
  );
});
