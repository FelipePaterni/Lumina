import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module";
import { AuditService } from "./application/services/audit.service";
import { AuditController } from "./presentation/audit.controller";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [PrismaModule, forwardRef(() => IdentityModule)],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
