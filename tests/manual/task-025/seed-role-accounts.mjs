import { randomBytes } from "node:crypto";
import process from "node:process";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.TASK009_TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("Configure TASK009_TEST_DATABASE_URL para o banco isolado.");
}

const databaseUrl = new URL(connectionString);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname) ||
  decodeURIComponent(databaseUrl.pathname.slice(1)) !== "lumina_task009_test"
) {
  throw new Error("O seeder aceita somente o banco local lumina_task009_test.");
}

const accounts = [
  { email: "task025-admin@example.invalid", role: "ADMIN" },
  { email: "task025-catalog@example.invalid", role: "CATALOG" },
  { email: "task025-stock@example.invalid", role: "STOCK" },
];
const prisma = new PrismaClient({ datasourceUrl: databaseUrl.toString() });

try {
  await prisma.$connect();
  const [{ name: connectedDatabase }] = await prisma.$queryRaw`
    SELECT current_database() AS name
  `;
  if (connectedDatabase !== "lumina_task009_test") {
    throw new Error("A conexão não chegou ao banco isolado esperado.");
  }

  const credentials = [];
  for (const account of accounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { role: true },
    });
    if (existing && existing.role !== account.role) {
      throw new Error(
        "Uma conta sintética reservada já possui papel diferente.",
      );
    }

    const password = randomBytes(24).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        passwordHash,
        role: account.role,
        isEmailConfirmed: true,
        isActive: true,
      },
      update: {
        passwordHash,
        isEmailConfirmed: true,
        isActive: true,
        deactivatedAt: null,
        scheduledDeletionAt: null,
      },
    });
    credentials.push({ role: account.role, email: account.email, password });
  }

  if (process.env.TASK025_API_BASE) {
    for (const account of credentials) {
      const response = await globalThis.fetch(
        new URL("/auth/login", process.env.TASK025_API_BASE),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: account.email,
            password: account.password,
          }),
        },
      );
      const result = await response.json().catch(() => null);
      if (
        !response.ok ||
        !result?.accessToken ||
        result.user?.role !== account.role
      ) {
        throw new Error(`Login sintético não confirmou papel ${account.role}.`);
      }
    }
  }

  process.stdout.write(
    `${JSON.stringify({ database: connectedDatabase, credentials }, null, 2)}\n`,
  );
} finally {
  await prisma.$disconnect();
}
