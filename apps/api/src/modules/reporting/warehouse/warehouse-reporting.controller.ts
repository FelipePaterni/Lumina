import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "../../identity/domain/role.enum.js";
import { Roles } from "../../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../../identity/presentation/guards/roles.guard.js";
import { WarehouseReportingService } from "./warehouse-reporting.service.js";

@Controller("admin/warehouse")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STOCK)
export class WarehouseReportingController {
  constructor(private readonly service: WarehouseReportingService) {}

  @Get("summary")
  summary() { return this.service.summary(); }
}
