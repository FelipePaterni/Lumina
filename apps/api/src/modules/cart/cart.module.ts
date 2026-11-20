import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { CouponModule } from "../coupons/coupon.module.js";
import { LibraryOwnershipModule } from "../library/ownership/library-ownership.module.js";
import { ShippingModule } from "../shipping/shipping.module.js";
import { CartController } from "./cart.controller.js";
import { CartService } from "./cart.service.js";

@Module({
  imports: [PrismaModule, IdentityModule, CouponModule, ShippingModule, LibraryOwnershipModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
