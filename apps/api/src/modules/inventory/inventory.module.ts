import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller.js";
import { InventoryService } from "./inventory.service.js";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { LogisticsModule } from "../logistics/logistics.module.js";
import { WarehouseReportingModule } from "../reporting/warehouse/warehouse-reporting.module.js";
import { AdminInventoryController } from "./admin-inventory.controller.js";

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    AuditModule,
    LogisticsModule,
    WarehouseReportingModule,
  ],
  controllers: [InventoryController, AdminInventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
