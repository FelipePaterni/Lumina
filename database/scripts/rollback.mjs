import console from "node:console";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "..", "migrations");

export async function rollbackLatest(connectionUrl) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          connectionUrl ||
          process.env.DATABASE_URL ||
          "postgresql://lumina:local-development-only@localhost:5433/lumina",
      },
    },
  });

  try {
    const applied = await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations" 
      WHERE rolled_back_at IS NULL 
      ORDER BY finished_at DESC
    `;

    if (!applied || applied.length === 0) {
      console.log("No applied migrations found to rollback.");
      return null;
    }

    const targetMigration = applied[0].migration_name;
    const rollbackSqlPath = path.join(
      migrationsDir,
      targetMigration,
      "rollback.sql",
    );

    if (!fs.existsSync(rollbackSqlPath)) {
      throw new Error(`Rollback script not found for: ${targetMigration}`);
    }

    const sql = fs.readFileSync(rollbackSqlPath, "utf-8");
    console.log(`Executing rollback for migration: ${targetMigration}...`);

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }

    console.log(`Rollback completed successfully for ${targetMigration}`);
    return targetMigration;
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  rollbackLatest().catch((err) => {
    console.error("Rollback failed:", err);
    process.exit(1);
  });
}
