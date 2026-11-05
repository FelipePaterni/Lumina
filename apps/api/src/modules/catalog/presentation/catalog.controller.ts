import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CatalogService } from "../application/catalog.service.js";
import { JwtAuthGuard } from "../../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../../identity/presentation/guards/roles.guard.js";
import { Roles } from "../../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../../identity/domain/role.enum.js";
import { AuditService } from "../../audit/application/services/audit.service.js";
import { WorkInput } from "../application/catalog.service.js";

@Controller("works")
export class CatalogController {
  constructor(private readonly catalog: CatalogService, private readonly audit: AuditService) {}
  @Get() list(@Query("search") search?: string, @Query("category") category?: string) { return this.catalog.list({ search, category }); }
  @Get(":slug") get(@Param("slug") slug: string) { return this.catalog.get(slug); }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CATALOG)
  async create(@Body() body: WorkInput, @Req() req: { user: { sub: string; role: Role } }) { const result = await this.catalog.upsert(body); await this.audit.logAction({ actorId: req.user.sub, actorRole: req.user.role, action: "CATALOG_WORK_CREATED", targetType: "WORK", targetId: result.id, reason: body.reason, metadata: { slug: result.slug } }); return result; }
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CATALOG)
  async update(@Param("id") id: string, @Body() body: WorkInput, @Req() req: { user: { sub: string; role: Role } }) { const result = await this.catalog.upsert(body, id); await this.audit.logAction({ actorId: req.user.sub, actorRole: req.user.role, action: "CATALOG_WORK_UPDATED", targetType: "WORK", targetId: id, reason: body.reason, metadata: { slug: result.slug } }); return result; }
  @Patch(":id/visibility")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CATALOG)
  async visibility(@Param("id") id: string, @Body() body: { isVisible: boolean; reason: string }, @Req() req: { user: { sub: string; role: Role } }) { const result = await this.catalog.hide(id, body.isVisible); await this.audit.logAction({ actorId: req.user.sub, actorRole: req.user.role, action: "CATALOG_VISIBILITY_CHANGED", targetType: "WORK", targetId: id, reason: body.reason, metadata: { isVisible: body.isVisible } }); return result; }
}
