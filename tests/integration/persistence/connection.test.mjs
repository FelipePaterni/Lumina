import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

test("PostgreSQL connection and health persistence via Prisma", async () => {
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
    // 1. Connectivity test
    const pingResult = await prisma.$queryRaw`SELECT 1 as result`;
    assert.ok(Array.isArray(pingResult));
    assert.equal(Number(pingResult[0].result), 1);

    // 2. Insert and verify temporal audit fields
    const created = await prisma.healthPersistence.create({
      data: {
        status: "connection-test-ok",
      },
    });

    assert.ok(created.id, "Record should have generated UUID");
    assert.equal(created.status, "connection-test-ok");
    assert.ok(
      created.createdAt instanceof Date,
      "createdAt must be a valid Date",
    );
    assert.ok(
      created.updatedAt instanceof Date,
      "updatedAt must be a valid Date",
    );

    // 3. Update and verify updatedAt changes
    const updated = await prisma.healthPersistence.update({
      where: { id: created.id },
      data: { status: "connection-test-updated" },
    });

    assert.equal(updated.status, "connection-test-updated");
    assert.ok(updated.updatedAt.getTime() >= created.updatedAt.getTime());

    // 4. Cleanup
    await prisma.healthPersistence.delete({
      where: { id: created.id },
    });
  } finally {
    await prisma.$disconnect();
  }
});
