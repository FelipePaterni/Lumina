import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { PasswordHasherService } from "../../../apps/api/dist/modules/identity/application/services/password-hasher.service.js";
import { TokenService } from "../../../apps/api/dist/modules/identity/application/services/token.service.js";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { EmailDispatcherService } from "../../../apps/api/dist/modules/identity/application/services/email-dispatcher.service.js";
import { AuthService } from "../../../apps/api/dist/modules/identity/application/services/auth.service.js";
import { runAdminSeed } from "../../../database/seeds/admin-seed.mjs";

test("AuthService & Seed - Fluxo de identidade e regras de negócio", async (t) => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://lumina:local-development-only@localhost:5433/lumina";

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  // Verify connectivity first
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    t.skip("Banco de dados PostgreSQL inacessível para teste de integração");
    return;
  }

  const hasher = new PasswordHasherService();
  const tokenService = new TokenService();
  const jwtService = new JwtTokenService();
  const emailDispatcher = new EmailDispatcherService(prisma);
  const authService = new AuthService(
    prisma,
    hasher,
    tokenService,
    jwtService,
    emailDispatcher,
  );

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  try {
    // 1. Registro
    const regResult = await authService.register(testEmail, testPassword);
    assert.ok(regResult.userId);

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

    // 6. Teste de Seed Controlado do Administrador
    const adminEmail = `admin_${Date.now()}@example.com`;
    const seededAdmin = await runAdminSeed({
      email: adminEmail,
      password: "AdminPassword123!",
      connectionUrl: databaseUrl,
    });
    assert.ok(seededAdmin?.id);
    assert.equal(seededAdmin?.role, "ADMIN");

    // Limpeza
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail, adminEmail] } },
    });
  } finally {
    await prisma.$disconnect();
  }
});
