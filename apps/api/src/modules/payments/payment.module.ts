import { Module } from "@nestjs/common";
import { SimulatedPaymentService } from "./simulated-payment.service.js";

@Module({ providers: [SimulatedPaymentService], exports: [SimulatedPaymentService] })
export class PaymentModule {}
