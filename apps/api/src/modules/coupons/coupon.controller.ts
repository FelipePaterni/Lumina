import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CouponDiscountType } from "@prisma/client";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { CouponService } from "./coupon.service.js";

@Controller("admin/coupons")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CATALOG)
export class CouponController {
  constructor(private readonly service: CouponService) {}

  @Get()
  list() { return this.service.list(); }

  @Post()
  create(@Body() body: {
    code: string;
    discountType: CouponDiscountType;
    fixedAmountCents?: number;
    percentageBasisPoints?: number;
    validFrom: string;
    validUntil: string;
    maxUses: number;
  }) { return this.service.create(body); }

  @Patch(":id/active")
  setActive(@Param("id") id: string, @Body() body: { isActive: boolean }) {
    return this.service.setActive(id, body.isActive);
  }
}
