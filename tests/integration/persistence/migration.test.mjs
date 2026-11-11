import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");

function deployMigrations(databaseUrl) {
  execSync("npm run db:migrate", {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "pipe",
  });
}

test("TASK-009 migrations deploy idempotently on an isolated database", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();

  // Migration verification must be isolated and forward-only. Never roll back
  // the latest migration: that could delete inventory data and does not model
  // a safe production recovery path.
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    const schemaObjects = await prisma.$queryRaw`
      SELECT
        to_regclass('public.inventories')::text AS inventories,
        to_regclass('public.inventory_movements')::text AS inventory_movements,
        to_regclass('public.digital_assets')::text AS digital_assets,
        to_regclass('public.digital_asset_versions')::text AS digital_asset_versions,
        EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'InventoryMovementType'
        ) AS inventory_movement_type
    `;

    assert.ok(schemaObjects[0].inventories);
    assert.ok(schemaObjects[0].inventory_movements);
    assert.ok(schemaObjects[0].digital_assets);
    assert.ok(schemaObjects[0].digital_asset_versions);
    assert.equal(schemaObjects[0].inventory_movement_type, true);

    const appliedMigration = await prisma.$queryRaw`
      SELECT finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20261110120000_inventory_schema_reconciliation'
        AND rolled_back_at IS NULL
    `;
    assert.equal(appliedMigration.length, 1);
  } finally {
    await prisma.$disconnect();
  }
});
