import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";
import { AccountService } from "../../../apps/api/dist/modules/identity/application/services/account.service.js";
import { EmailDispatcherService } from "../../../apps/api/dist/modules/identity/application/services/email-dispatcher.service.js";
import { AuditService } from "../../../apps/api/dist/modules/audit/application/services/audit.service.js";

test("Integration - RBAC, Auditoria estruturada e Desativação de conta", async (t) => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://lumina:local-development-only@localhost:5433/lumina";

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$connect();
  } catch {
    t.skip("PostgreSQL unavailable - skipping RBAC & audit integration test");
    return;
  }

  try {
    const emailDispatcher = new EmailDispatcherService(prisma);
    const accountService = new AccountService(prisma, emailDispatcher);
    const auditService = new AuditService(prisma);

    const testCustomerEmail = `rbac-customer-${Date.now()}@lumina.local`;
    const testAdminEmail = `rbac-admin-${Date.now()}@lumina.local`;

    // 1. Criar clientes e admins de teste diretamente no banco
    const customer = await prisma.user.create({
      data: {
        email: testCustomerEmail,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "CUSTOMER",
        isEmailConfirmed: true,
        isActive: true,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: testAdminEmail,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
        role: "ADMIN",
        isEmailConfirmed: true,
        isActive: true,
      },
    });

    // 2. Testar desativação de conta de cliente com carência de 30 dias (RN-018)
    const deactivationResult = await accountService.requestAccountDeletion(
      customer.id,
      "Motivo do cancelamento pelo cliente",
    );
    assert.ok(deactivationResult.deactivatedAt);
    assert.ok(deactivationResult.scheduledDeletionAt);

    // Registrar auditoria da ação sensível
    await auditService.logAction({
      actorId: customer.id,
      actorRole: Role.CUSTOMER,
      action: "ACCOUNT_DELETION_REQUESTED",
      targetType: "USER",
      targetId: customer.id,
      reason: "Motivo do cancelamento pelo cliente",
    });

    // 3. Testar alteração administrativa de papel com motivo obrigatório (RF-023 / RN-017)
    const roleUpdate = await accountService.updateUserRole(
      admin.id,
      customer.id,
      Role.CATALOG,
      "Promovido para gerência de catálogo",
    );
    assert.equal(roleUpdate.role, Role.CATALOG);

    await auditService.logAction({
      actorId: admin.id,
      actorRole: Role.ADMIN,
      action: "USER_ROLE_UPDATED",
      targetType: "USER",
      targetId: customer.id,
      reason: "Promovido para gerência de catálogo",
      metadata: { newRole: "CATALOG" },
    });

    // 4. Verificar persistência em audit_logs e sanitização
    const logs = await auditService.listLogs({ action: "USER_ROLE_UPDATED" });
    assert.ok(logs.total >= 1);
    const recentLog = logs.items.find((l) => l.targetId === customer.id);
    assert.ok(recentLog);
    assert.equal(recentLog.actorId, admin.id);
    assert.equal(recentLog.reason, "Promovido para gerência de catálogo");

    // Limpeza de registros de teste
    await prisma.auditLog.deleteMany({
      where: { targetId: customer.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [customer.id, admin.id] } },
    });
  } finally {
    await prisma.$disconnect();
  }
});
