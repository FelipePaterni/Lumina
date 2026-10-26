import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../domain/role.enum.js";
import { PasswordHasherService } from "./password-hasher.service.js";

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
  }

  async seedAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return;
    }

    const normalizedEmail = adminEmail.trim().toLowerCase();

    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      return;
    }

    const passwordHash = await this.hasher.hash(adminPassword);

    await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: Role.ADMIN,
        isEmailConfirmed: true,
        isActive: true,
      },
    });
  }
}
