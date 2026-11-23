import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CatalogService } from "../application/catalog.service.js";
import { JwtAuthGuard } from "../../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../../identity/presentation/guards/roles.guard.js";
import { Roles } from "../../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../../identity/domain/role.enum.js";

@Controller("admin/works")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CATALOG)
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(
    @Query("search") search?: string,
    @Query("visibility") visibility?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    if (visibility && !["visible", "hidden", "all"].includes(visibility)) {
      throw new BadRequestException("Filtro de visibilidade inválido.");
    }
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
    return this.catalog.listAdmin({
      search,
      visibility,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.catalog.getAdminById(id);
  }
}
