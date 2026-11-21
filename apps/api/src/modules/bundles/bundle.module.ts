import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { BundleController } from "./bundle.controller.js";
import { BundleService } from "./bundle.service.js";

@Module({
  imports: [PrismaModule, AuditModule, IdentityModule],
  controllers: [BundleController],
  providers: [BundleService],
})
export class BundleModule {}
