import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module.js";
import { PaymentModule } from "../payments/payment.module.js";
import { NotificationModule } from "../notifications/notification.module.js";
import { OrderController } from "./order.controller.js";
import { OrderService } from "./order.service.js";

@Module({
  imports: [IdentityModule, PaymentModule, NotificationModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
