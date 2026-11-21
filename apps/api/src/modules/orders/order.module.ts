import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module.js";
import { PaymentModule } from "../payments/payment.module.js";
import { NotificationModule } from "../notifications/notification.module.js";
import { OrderController } from "./order.controller.js";
import { OrderService } from "./order.service.js";
import { RefundService } from "../refunds/refund.service.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
  imports: [IdentityModule, PaymentModule, NotificationModule, AuditModule],
  controllers: [OrderController],
  providers: [OrderService, RefundService],
})
export class OrderModule {}
