import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/application/services/audit.service.js";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { BundleService } from "./bundle.service.js";

interface ActorRequest {
  user: { sub: string; role: Role };
}

@Controller("bundles")
export class BundleController {
  constructor(private readonly service: BundleService, private readonly audit: AuditService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CATALOG)
  async create(
    @Body() body: { name: unknown; priceCents: unknown; workIds: unknown; reason?: unknown },
    @Req() request: ActorRequest,
  ) {
    const result = await this.service.create(body);
    await this.audit.logAction({
      actorId: request.user.sub,
      actorRole: request.user.role,
      action: "BUNDLE_CREATED",
      targetType: "BUNDLE",
      targetId: result.id,
      reason: typeof body.reason === "string" ? body.reason : undefined,
      metadata: { itemCount: result.items.length, priceCents: result.priceCents },
    });
    return result;
  }
}
