import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { ShippingController } from "./shipping.controller.js";
import { ShippingService } from "./shipping.service.js";

@Module({ imports: [PrismaModule, IdentityModule], controllers: [ShippingController], providers: [ShippingService], exports: [ShippingService] })
export class ShippingModule {}
