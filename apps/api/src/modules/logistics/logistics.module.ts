import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { NotificationModule } from "../notifications/notification.module.js";
import { LogisticsController } from "./logistics.controller.js";
import { LogisticsService } from "./logistics.service.js";

@Module({
  imports: [PrismaModule, IdentityModule, AuditModule, NotificationModule],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
