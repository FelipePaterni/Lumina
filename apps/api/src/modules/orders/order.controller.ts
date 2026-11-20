import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { ShippingAddressInput } from "../shipping/shipping.rules.js";
import { OrderService } from "./order.service.js";

interface CustomerRequest {
  user: { sub: string; role: Role; isEmailConfirmed: boolean };
}

interface CheckoutBody {
  shippingAddress?: ShippingAddressInput;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class OrderController {
  constructor(private readonly service: OrderService) {}

  private customerId(request: CustomerRequest): string {
    if (!request.user.isEmailConfirmed) {
      throw new ForbiddenException("Confirme seu e-mail para finalizar compras");
    }
    return request.user.sub;
  }

  @Post("checkout")
  checkout(
    @Body() body: CheckoutBody,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() request: CustomerRequest,
  ) {
    return this.service.checkout(this.customerId(request), idempotencyKey, body?.shippingAddress);
  }

  @Get("orders/:id")
  get(@Param("id") orderId: string, @Req() request: CustomerRequest) {
    return this.service.get(this.customerId(request), orderId);
  }
}
