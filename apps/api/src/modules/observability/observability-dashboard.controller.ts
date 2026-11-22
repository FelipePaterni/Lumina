import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { ObservabilityDashboardService } from "./observability-dashboard.service.js";

@Controller("admin/observability/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ObservabilityDashboardController {
  constructor(private readonly service: ObservabilityDashboardService) {}

  @Get()
  summary() {
    return this.service.summary();
  }
}
