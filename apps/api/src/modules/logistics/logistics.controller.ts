import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { LogisticsService } from "./logistics.service.js";

interface RequestUser { user: { sub: string; role: Role } }

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}

  @Get("admin/logistics/orders")
  @Roles(Role.ADMIN, Role.STOCK)
  listForStaff(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.service.listForStaff(page, limit);
  }

  @Post("admin/logistics/orders/:id/status")
  @Roles(Role.ADMIN, Role.STOCK)
  updateStatus(
    @Param("id") orderId: string,
    @Body() body: { status?: unknown; trackingCode?: unknown },
    @Req() request: RequestUser,
  ) {
    return this.service.transition(
      orderId,
      body?.status,
      body?.trackingCode,
      request.user.sub,
      request.user.role,
    );
  }

  @Get("orders/:id/tracking")
  @Roles(Role.CUSTOMER)
  getCustomerTracking(@Param("id") orderId: string, @Req() request: RequestUser) {
    return this.service.getForCustomer(orderId, request.user.sub);
  }
}
