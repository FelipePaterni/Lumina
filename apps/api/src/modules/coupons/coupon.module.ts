import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { CouponController } from "./coupon.controller.js";
import { CouponService } from "./coupon.service.js";

@Module({ imports: [PrismaModule, IdentityModule], controllers: [CouponController], providers: [CouponService], exports: [CouponService] })
export class CouponModule {}
