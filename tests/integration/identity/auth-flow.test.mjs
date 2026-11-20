import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { PasswordHasherService } from "../../../apps/api/dist/modules/identity/application/services/password-hasher.service.js";
import { TokenService } from "../../../apps/api/dist/modules/identity/application/services/token.service.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { NotificationService } from "../../../apps/api/dist/modules/notifications/notification.service.js";
import { SimulatedEmailTransport } from "../../../apps/api/dist/modules/notifications/simulated-email-transport.js";
import { AuthService } from "../../../apps/api/dist/modules/identity/application/services/auth.service.js";
import { runAdminSeed } from "../../../database/seeds/admin-seed.mjs";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

test("AuthService & Seed - Fluxo de identidade e regras de negócio", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  await prisma.$queryRaw`SELECT 1`;

  const hasher = new PasswordHasherService();
  const tokenService = new TokenService();
  const jwtService = new JwtTokenService();
  const notifications = new NotificationService(prisma, new SimulatedEmailTransport());
  const authService = new AuthService(
    prisma,
    hasher,
    tokenService,
    jwtService,
    notifications,
  );

  const testEmail = `test_${Date.now()}@example.com`;
  const adminEmail = `admin_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  let testUserId;

  try {
    // 1. Registro
    const regResult = await authService.register(testEmail, testPassword);
    testUserId = regResult.userId;
    assert.ok(regResult.userId);
    const confirmationNotifications = await prisma.outboxEmail.findMany({
      where: { eventType: "EMAIL_CONFIRMATION_REQUESTED", eventKey: { startsWith: `identity:${regResult.userId}:` } },
    });
    assert.equal(confirmationNotifications.length, 1);
    assert.equal(confirmationNotifications[0].deliveryStatus, "SENT");
    assert.equal(confirmationNotifications[0].attemptCount, 1);

    // 2. Tentar login antes de confirmar e-mail
    const loginBeforeConfirm = await authService.login(testEmail, testPassword);
    assert.equal(
      loginBeforeConfirm.user.isEmailConfirmed,
      false,
      "E-mail deve constar como não confirmado",
    );

    // 3. Confirmar e-mail com token correto
    const verificationRecord = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResult.userId },
    });
    assert.ok(verificationRecord);

    // 4. Teste de confirmação com token inválido
    await assert.rejects(
      async () => authService.confirmEmail("invalid-token-123"),
      /Token de confirmação inválido/,
    );

    // 5. Anti-enumeração em recuperação de senha
    const forgotNonExistent = await authService.forgotPassword(
      "nonexistent@example.com",
    );
    const forgotExistent = await authService.forgotPassword(testEmail);
    assert.equal(
      forgotNonExistent.message,
      forgotExistent.message,
      "Mensagem deve ser idêntica para evitar enumeração",
    );
    const resetNotifications = await prisma.outboxEmail.findMany({
      where: { eventType: "PASSWORD_RESET_REQUESTED", eventKey: { startsWith: `identity:${regResult.userId}:` } },
    });
    assert.equal(resetNotifications.length, 1);
    assert.equal(resetNotifications[0].deliveryStatus, "SENT");

    // 6. Teste de Seed Controlado do Administrador
    const seededAdmin = await runAdminSeed({
      email: adminEmail,
      password: "AdminPassword123!",
      connectionUrl: databaseUrl,
    });
    assert.ok(seededAdmin?.id);
    assert.equal(seededAdmin?.role, "ADMIN");

  } finally {
    await prisma.outboxEmail.deleteMany({
      where: {
        OR: [
          { toEmail: testEmail },
          ...(testUserId ? [{ eventKey: { startsWith: `identity:${testUserId}:` } }] : []),
        ],
      },
    });
    await prisma.user.deleteMany({ where: { email: { in: [testEmail, adminEmail] } } });
    await prisma.$disconnect();
  }
});
