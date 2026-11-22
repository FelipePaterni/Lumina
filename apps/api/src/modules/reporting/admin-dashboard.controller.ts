import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { AdminDashboardService } from "./admin-dashboard.service.js";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  summary() {
    return this.service.summary();
  }
}
