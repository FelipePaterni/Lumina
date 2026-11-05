import { Module } from "@nestjs/common";
import { AssetsController } from "./assets.controller.js";
import { AssetsService } from "./assets.service.js";
import { PrismaModule } from "../../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../../identity/identity.module.js";
import { AuditModule } from "../../audit/audit.module.js";
import { PrivateLocalStorage } from "../../../storage/private-local.storage.js";

@Module({
  imports: [PrismaModule, IdentityModule, AuditModule],
  controllers: [AssetsController],
  providers: [AssetsService, PrivateLocalStorage],
})
export class AssetsModule {}
