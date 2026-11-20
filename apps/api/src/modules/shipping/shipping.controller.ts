import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { ShippingService } from "./shipping.service.js";

@Controller("admin/shipping-rules")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Get()
  list() { return this.service.list(); }

  @Post()
  create(@Body() body: {
    postalCodeStart: string;
    postalCodeEnd: string;
    minPhysicalQuantity: number;
    maxPhysicalQuantity?: number | null;
    priceCents: number;
    priority?: number;
  }) { return this.service.create(body); }

  @Patch(":id/active")
  setActive(@Param("id") id: string, @Body() body: { isActive: boolean }) {
    return this.service.setActive(id, body.isActive);
  }
}
