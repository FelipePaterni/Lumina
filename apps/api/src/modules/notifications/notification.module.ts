import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { NotificationService } from "./notification.service.js";
import { SimulatedEmailTransport } from "./simulated-email-transport.js";

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, SimulatedEmailTransport],
  exports: [NotificationService],
})
export class NotificationModule {}
