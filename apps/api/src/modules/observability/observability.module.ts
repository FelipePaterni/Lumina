import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { ObservabilityDashboardController } from "./observability-dashboard.controller.js";
import { ObservabilityDashboardService } from "./observability-dashboard.service.js";

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [ObservabilityDashboardController],
  providers: [ObservabilityDashboardService],
})
export class ObservabilityModule {}
