import assert from "node:assert/strict";
import process from "node:process";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

const [action, couponId] = process.argv.slice(2);
assert.ok(["exhaust", "reset"].includes(action), "Expected exhaust or reset action");
assert.ok(couponId, "Coupon ID is required");
const databaseUrl = process.env.TASK012_MANUAL_DATABASE_URL;
assert.ok(databaseUrl, "TASK012_MANUAL_DATABASE_URL is required");
const parsed = new URL(databaseUrl);
assert.equal(parsed.hostname, "localhost", "Only local PostgreSQL is allowed");
assert.ok(["lumina", "lumina_task009_test"].includes(decodeURIComponent(parsed.pathname.slice(1))), "Only a local Lumina test database is allowed");

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
try {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  assert.ok(coupon?.code.startsWith("T012-MANUAL-"), "Only a coupon created by this manual script may be changed");
  const result = await prisma.coupon.updateMany({
    where: { id: coupon.id, code: coupon.code },
    data: { usageCount: action === "exhaust" ? coupon.maxUses : 0 },
  });
  assert.equal(result.count, 1, "Synthetic coupon was not updated");
} finally {
  await prisma.$disconnect();
}
