import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { AdminDashboardController } from "./admin-dashboard.controller.js";
import { AdminDashboardService } from "./admin-dashboard.service.js";
import { CatalogDashboardController } from "./catalog-dashboard.controller.js";
import { CatalogDashboardService } from "./catalog-dashboard.service.js";

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [AdminDashboardController, CatalogDashboardController],
  providers: [AdminDashboardService, CatalogDashboardService],
})
export class DashboardReportingModule {}
