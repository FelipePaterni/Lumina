import { existsSync } from "node:fs";
import process from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

const taskDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(taskDirectory, "../../..");

export function loadLocalEnvironment() {
  const envPath = resolve(repositoryRoot, ".env");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

export function getTaskDatabaseUrl() {
  const databaseUrl = process.env.TASK009_TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Configure TASK009_TEST_DATABASE_URL no ambiente ou em .env para lumina_task009_test.");
  }
  const parsedUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
  if (databaseName !== "lumina_task009_test") {
    throw new Error("TASK009_TEST_DATABASE_URL deve apontar exclusivamente para lumina_task009_test.");
  }
  return databaseUrl;
}

export function getTaskCustomerEmails() {
  const customer1Email = (process.env.TASK021_CUSTOMER_1_EMAIL ?? process.env.TEST_CUSTOMER_1_EMAIL)?.trim().toLowerCase();
  const customer2Email = (process.env.TASK021_CUSTOMER_2_EMAIL ?? process.env.TEST_CUSTOMER_2_EMAIL)?.trim().toLowerCase();
  if (!customer1Email || !customer2Email || customer1Email === customer2Email) {
    throw new Error("Configure duas contas CUSTOMER sintéticas distintas em TASK021_CUSTOMER_1_EMAIL e TASK021_CUSTOMER_2_EMAIL (ou TEST_CUSTOMER_1_EMAIL/2).");
  }
  if (!customer1Email.endsWith("@example.invalid") || !customer2Email.endsWith("@example.invalid")) {
    throw new Error("As contas de teste devem usar o domínio reservado example.invalid.");
  }
  return { customer1Email, customer2Email };
}

export function getTaskLoginCredentials() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const customer1Password = process.env.TEST_CUSTOMER_1_PASSWORD;
  const customer2Password = process.env.TEST_CUSTOMER_2_PASSWORD;
  if (!adminEmail?.endsWith("@example.invalid") || !adminPassword || !customer1Password || !customer2Password) {
    throw new Error("Configure ADMIN_SEED_EMAIL/PASSWORD e TEST_CUSTOMER_1/2_PASSWORD com contas sintéticas no .env.");
  }
  return { adminEmail, adminPassword, customer1Password, customer2Password };
}
