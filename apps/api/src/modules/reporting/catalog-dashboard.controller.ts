import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { CatalogDashboardService } from "./catalog-dashboard.service.js";

@Controller("catalog/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CATALOG)
export class CatalogDashboardController {
  constructor(private readonly service: CatalogDashboardService) {}

  @Get()
  summary() {
    return this.service.summary();
  }
}
