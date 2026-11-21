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
import { RefundService } from "../refunds/refund.service.js";

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
  constructor(private readonly service: OrderService, private readonly refunds: RefundService) {}

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

  @Post("orders/:id/cancel")
  requestCancellation(
    @Param("id") orderId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: { orderItemId?: unknown; reason?: unknown },
    @Req() request: CustomerRequest,
  ) {
    if (!request.user.isEmailConfirmed) {
      throw new ForbiddenException("Confirme seu e-mail para solicitar cancelamentos");
    }
    return this.refunds.requestCancellation(
      orderId,
      typeof body?.orderItemId === "string" ? body.orderItemId : "",
      request.user.sub,
      idempotencyKey,
      body?.reason,
    );
  }

  @Post("orders/:id/refund")
  requestRefund(
    @Param("id") orderId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: { orderItemId?: unknown; reason?: unknown },
    @Req() request: CustomerRequest,
  ) {
    if (!request.user.isEmailConfirmed) {
      throw new ForbiddenException("Confirme seu e-mail para solicitar reembolsos");
    }
    return this.refunds.requestCancellation(
      orderId,
      typeof body?.orderItemId === "string" ? body.orderItemId : "",
      request.user.sub,
      idempotencyKey,
      body?.reason,
    );
  }

  @Get("admin/refunds")
  @Roles(Role.ADMIN)
  listPendingRefunds() {
    return this.refunds.listPending();
  }

  @Post("admin/refunds/:id/decision")
  @Roles(Role.ADMIN)
  decideRefund(
    @Param("id") refundId: string,
    @Body() body: { decision?: unknown; reason?: unknown; returnConfirmed?: unknown },
    @Req() request: CustomerRequest,
  ) {
    return this.refunds.decide(refundId, request.user.sub, body?.decision, body?.reason, body?.returnConfirmed);
  }

  @Post("admin/refunds/:id/confirm-return")
  @Roles(Role.ADMIN)
  confirmRefundReturn(
    @Param("id") refundId: string,
    @Body() body: { reason?: unknown },
    @Req() request: CustomerRequest,
  ) {
    return this.refunds.confirmReturn(refundId, request.user.sub, body?.reason);
  }
}
