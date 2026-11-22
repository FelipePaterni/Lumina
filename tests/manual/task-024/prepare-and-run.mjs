import "reflect-metadata";
import process from "node:process";
import console from "node:console";
import { URL } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../../apps/api/dist/app.module.js";

const url = new URL(process.env.TASK009_TEST_DATABASE_URL || process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("A preparação exige PostgreSQL local.");
}
if (!process.env.TASK009_TEST_DATABASE_URL) url.pathname = "/lumina_task009_test";
if (decodeURIComponent(url.pathname.slice(1)) !== "lumina_task009_test") {
  throw new Error("Use exclusivamente lumina_task009_test.");
}
process.env.DATABASE_URL = url.toString();
process.env.ADMIN_SEED_EMAIL = "";
process.env.ADMIN_SEED_PASSWORD = "";
process.env.LOCAL_TEST_ACCOUNTS_ENABLED = "false";

const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
let app;
let stage = "conexão ao banco isolado";
try {
  await prisma.$connect();
  const [{ name }] = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (name !== "lumina_task009_test") throw new Error("Banco inesperado.");

  const credentials = [];
  stage = "criação de contas sintéticas";
  for (const role of ["ADMIN", "CATALOG", "STOCK", "CUSTOMER"]) {
    const email = `task024-${randomUUID()}@example.invalid`;
    const password = randomBytes(32).toString("base64url");
    await prisma.user.create({ data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      isEmailConfirmed: true,
      isActive: true,
    } });
    credentials.push({ role, email, password });
  }

  stage = "inicialização da API temporária";
  app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  await app.listen(0, "127.0.0.1");
  const apiBase = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  const childEnv = { ...process.env };

  stage = "login das contas sintéticas";
  for (const { role, email, password } of credentials) {
    const response = await globalThis.fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok || !result.accessToken || result.user?.role !== role) {
      throw new Error("Login sintético não confirmou o papel esperado.");
    }
    childEnv[`TASK024_${role}_TOKEN`] = result.accessToken;
  }
  credentials.length = 0;
  childEnv.TASK024_API_BASE = apiBase;
  childEnv.TASK024_WEB_BASE = process.env.TASK024_WEB_BASE || "http://localhost:3000";

  stage = "execução do roteiro PowerShell";
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn("pwsh", ["-NoProfile", "-Command",
      "& ./tests/manual/task-024/run-task-024-manual-tests.ps1 -AdminToken $env:TASK024_ADMIN_TOKEN -CatalogToken $env:TASK024_CATALOG_TOKEN -StockToken $env:TASK024_STOCK_TOKEN -CustomerToken $env:TASK024_CUSTOMER_TOKEN -ApiBaseUrl $env:TASK024_API_BASE -WebBaseUrl $env:TASK024_WEB_BASE"],
    { env: childEnv, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", resolve);
  });
  process.exitCode = exitCode === 0 ? 0 : 1;
} catch (error) {
  console.error(`Etapa bloqueada: ${stage}; código: ${/^[A-Z0-9_]+$/.test(error.code || error.errorCode || "") ? error.code || error.errorCode : "indisponível"}.`);
  console.error("Preparação/execução bloqueada. Confira banco isolado migrado, build atual da API, PowerShell 7 e Web local. Detalhes omitidos.");
  process.exitCode = 1;
} finally {
  if (app) await app.close();
  await prisma.$disconnect();
}
