import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../../identity/identity.module.js";
import { WarehouseReportingController } from "./warehouse-reporting.controller.js";
import { WarehouseReportingService } from "./warehouse-reporting.service.js";

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [WarehouseReportingController],
  providers: [WarehouseReportingService],
})
export class WarehouseReportingModule {}
