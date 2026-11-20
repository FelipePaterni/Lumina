import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../domain/role.enum.js";
import { PasswordHasherService } from "./password-hasher.service.js";

type LocalCustomerSeed = {
  email: string;
  password: string;
};

@Injectable()
export class LocalCustomerSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedCustomers();
  }

  async seedCustomers(): Promise<void> {
    if (
      process.env.NODE_ENV !== "development" ||
      process.env.LOCAL_TEST_ACCOUNTS_ENABLED !== "true"
    ) {
      return;
    }

    const customers: LocalCustomerSeed[] = [
      {
        email: process.env.TEST_CUSTOMER_1_EMAIL ?? "",
        password: process.env.TEST_CUSTOMER_1_PASSWORD ?? "",
      },
      {
        email: process.env.TEST_CUSTOMER_2_EMAIL ?? "",
        password: process.env.TEST_CUSTOMER_2_PASSWORD ?? "",
      },
    ];

    if (
      customers.some(({ email, password }) => !email.trim() || !password) ||
      customers.some(({ email }) => !/^\S+@example\.invalid$/i.test(email.trim()))
    ) {
      throw new Error(
        "Local test account seed requires two configured @example.invalid emails and passwords.",
      );
    }

    const normalizedEmails = customers.map(({ email }) => email.trim().toLowerCase());
    if (new Set(normalizedEmails).size !== customers.length) {
      throw new Error("Local test account seed requires distinct customer emails.");
    }

    for (const [index, customer] of customers.entries()) {
      const email = normalizedEmails[index];
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.role !== Role.CUSTOMER) {
        throw new Error(
          "Local test account seed found a configured email assigned to a non-customer role.",
        );
      }

      const passwordHash = await this.hasher.hash(customer.password);
      if (existingUser) {
        await this.prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            isEmailConfirmed: true,
            isActive: true,
            deactivatedAt: null,
            scheduledDeletionAt: null,
          },
        });
      } else {
        await this.prisma.user.create({
          data: {
            email,
            passwordHash,
            role: Role.CUSTOMER,
            isEmailConfirmed: true,
            isActive: true,
          },
        });
      }
    }
  }
}
