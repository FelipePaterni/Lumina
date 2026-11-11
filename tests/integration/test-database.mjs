import assert from "node:assert/strict";
import process from "node:process";
import { URL } from "node:url";

export function getIntegrationDatabaseUrl() {
  const databaseUrl = process.env.TASK009_TEST_DATABASE_URL;
  assert.ok(
    databaseUrl,
    "Configure TASK009_TEST_DATABASE_URL para o banco isolado lumina_task009_test antes da integração.",
  );

  const parsedUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
  assert.equal(
    databaseName,
    "lumina_task009_test",
    "A suíte de integração só pode usar o banco isolado lumina_task009_test.",
  );

  return databaseUrl;
}
