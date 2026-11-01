import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "./modules/identity/identity.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";

@Module({
  imports: [PrismaModule, IdentityModule, AuditModule],
})
export class AppModule {}
