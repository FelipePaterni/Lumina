import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { ShippingAddressInput } from "../shipping/shipping.rules.js";
import { CartService } from "./cart.service.js";

interface CustomerRequest {
  user: { sub: string; role: Role; isEmailConfirmed: boolean };
}

@Controller("cart")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class CartController {
  constructor(private readonly service: CartService) {}

  private customerId(request: CustomerRequest): string {
    if (!request.user.isEmailConfirmed) throw new ForbiddenException("Confirme seu e-mail para usar o carrinho");
    return request.user.sub;
  }

  @Get()
  get(@Req() request: CustomerRequest) { return this.service.get(this.customerId(request)); }

  @Post("items")
  add(@Body() body: { editionId: string; quantity?: number }, @Req() request: CustomerRequest) {
    return this.service.add(this.customerId(request), body.editionId, body.quantity ?? 1);
  }

  @Post("bundles")
  addBundle(@Body() body: { bundleId: string }, @Req() request: CustomerRequest) {
    return this.service.addBundle(this.customerId(request), body.bundleId);
  }

  @Patch("items/:editionId")
  setQuantity(@Param("editionId") editionId: string, @Body() body: { quantity: number }, @Req() request: CustomerRequest) {
    return this.service.setQuantity(this.customerId(request), editionId, body.quantity);
  }

  @Delete("items/:editionId")
  remove(@Param("editionId") editionId: string, @Req() request: CustomerRequest) {
    return this.service.remove(this.customerId(request), editionId);
  }

  @Delete("bundles/:bundleId")
  removeBundle(@Param("bundleId") bundleId: string, @Req() request: CustomerRequest) {
    return this.service.removeBundle(this.customerId(request), bundleId);
  }

  @Post("coupon")
  applyCoupon(@Body() body: { code: string }, @Req() request: CustomerRequest) {
    return this.service.applyCoupon(this.customerId(request), body.code);
  }

  @Delete("coupon")
  removeCoupon(@Req() request: CustomerRequest) { return this.service.removeCoupon(this.customerId(request)); }

  @Post("shipping-quote")
  quoteShipping(@Body() body: { address: ShippingAddressInput }, @Req() request: CustomerRequest) {
    return this.service.quoteShipping(this.customerId(request), body.address);
  }
}
