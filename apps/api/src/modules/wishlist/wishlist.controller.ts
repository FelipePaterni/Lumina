import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { WishlistService } from "./wishlist.service.js";

interface AuthenticatedRequest {
  user: { sub: string; role: Role };
}

@Controller("wishlist")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.wishlist.list(request.user.sub);
  }

  @Post()
  add(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    if (
      typeof body !== "object" ||
      body === null ||
      !("workId" in body) ||
      typeof body.workId !== "string" ||
      !body.workId.trim()
    ) {
      throw new BadRequestException("workId é obrigatório");
    }
    return this.wishlist.add(request.user.sub, body.workId.trim());
  }

  @Delete(":workId")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("workId") workId: string,
  ) {
    return this.wishlist.remove(request.user.sub, workId);
  }
}
