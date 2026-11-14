import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module.js";
import { WishlistController } from "./wishlist.controller.js";
import { WishlistService } from "./wishlist.service.js";

@Module({
  imports: [IdentityModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
