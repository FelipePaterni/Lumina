import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { getIntegrationDatabaseUrl } from "../test-database.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function deployMigrations(databaseUrl) {
  execSync("npm run db:migrate", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

test("TASK-012 commerce migration deploys repeatedly in the isolated database", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  deployMigrations(databaseUrl);
  deployMigrations(databaseUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const objects = await prisma.$queryRaw`
      SELECT
        to_regclass('public.carts')::text AS carts,
        to_regclass('public.cart_items')::text AS cart_items,
        to_regclass('public.coupons')::text AS coupons,
        to_regclass('public.shipping_rules')::text AS shipping_rules,
        to_regclass('public.library_items')::text AS library_items,
        EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CouponDiscountType') AS coupon_discount_type
    `;
    for (const table of ["carts", "cart_items", "coupons", "shipping_rules", "library_items"]) {
      assert.ok(objects[0][table], `missing ${table}`);
    }
    assert.equal(objects[0].coupon_discount_type, true);
    const migrations = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE migration_name IN (
        '20261120120000_task_012_commerce_foundation',
        '20261120121500_task_012_cart_item_cleanup'
      )
        AND rolled_back_at IS NULL
      ORDER BY migration_name
    `;
    assert.deepEqual(migrations.map((row) => row.migration_name), [
      "20261120120000_task_012_commerce_foundation",
      "20261120121500_task_012_cart_item_cleanup",
    ]);
    const cartItemForeignKey = await prisma.$queryRaw`
      SELECT confdeltype::text AS delete_action
      FROM pg_constraint
      WHERE conname = 'cart_items_edition_id_fkey'
    `;
    assert.equal(cartItemForeignKey[0].delete_action, "c");
  } finally {
    await prisma.$disconnect();
  }
});
