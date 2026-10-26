import console from "node:console";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const schemaPath = path.resolve(__dirname, "../schema.prisma");

export function runMigrate(connectionUrl) {
  const databaseUrl =
    connectionUrl ||
    process.env.DATABASE_URL ||
    "postgresql://lumina:local-development-only@localhost:5433/lumina";

  console.log("Running prisma migrate deploy...");
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    runMigrate();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
