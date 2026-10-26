import console from "node:console";
import process from "node:process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function runAdminSeed(options) {
  const adminEmail = options?.email || process.env.ADMIN_SEED_EMAIL;
  const adminPassword = options?.password || process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      "Admin seed skipped: ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not provided.",
    );
    return null;
  }

  const prisma = new PrismaClient({
    datasourceUrl:
      options?.connectionUrl ||
      process.env.DATABASE_URL ||
      "postgresql://lumina:local-development-only@localhost:5433/lumina",
  });

  try {
    const existing = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existing) {
      console.log("Admin already exists. Seed skipped.");
      return existing;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail.trim().toLowerCase(),
        passwordHash,
        role: "ADMIN",
        isEmailConfirmed: true,
        isActive: true,
      },
    });

    console.log(`Admin user seeded successfully with ID: ${admin.id}`);
    return admin;
  } finally {
    await prisma.$disconnect();
  }
}
