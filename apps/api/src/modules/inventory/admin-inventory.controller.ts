import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { InventoryService } from "./inventory.service.js";

@Controller("admin/inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STOCK)
export class AdminInventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  list(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    if ((search?.length ?? 0) > 120)
      throw new BadRequestException("Busca excede o limite permitido.");
    if (page && (!Number.isSafeInteger(Number(page)) || Number(page) < 1))
      throw new BadRequestException("Página inválida.");
    if (
      limit &&
      (!Number.isSafeInteger(Number(limit)) ||
        Number(limit) < 1 ||
        Number(limit) > 100)
    )
      throw new BadRequestException("Limite inválido.");
    return this.service.listAdmin({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
