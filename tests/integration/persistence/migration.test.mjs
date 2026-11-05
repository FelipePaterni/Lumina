import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { rollbackLatest } from "../../../database/scripts/rollback.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");

test("Database migration up and rollback lifecycle", async () => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://lumina:local-development-only@localhost:5433/lumina";

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // 1. Verify the latest TASK-004 migration is applied
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    `;
    assert.equal(
      tableCheck.length,
      1,
      "audit_logs table should exist after migration",
    );

    // 2. Perform rollback
    const rolledBackMigration = await rollbackLatest(databaseUrl);
    assert.ok(rolledBackMigration, "A migration should have been rolled back");

    // Verify the latest migration artifacts were dropped by rollback.
    const afterRollbackCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'works'
    `;
    assert.equal(
      afterRollbackCheck.length,
      0,
      "works table should be dropped after rollback",
    );

    // 3. Re-apply migration using db:migrate
    execSync("npm run db:migrate", {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: "pipe",
    });

    // 4. Verify TASK-004 artifacts exist again
    const restoredCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    `;
    assert.equal(
      restoredCheck.length,
      1,
      "audit_logs table should exist again after re-migration",
    );

    const restoredColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('deactivated_at', 'scheduled_deletion_at')
    `;
    assert.equal(
      restoredColumns.length,
      2,
      "account deletion columns should exist again after re-migration",
    );
  } finally {
    await prisma.$disconnect();
  }
});
