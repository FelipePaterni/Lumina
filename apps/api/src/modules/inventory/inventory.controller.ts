import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { InventoryService } from "./inventory.service.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";

@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STOCK)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}
  @Get(":editionId") get(@Param("editionId") editionId: string) { return this.service.get(editionId); }
  @Patch(":editionId/physical") physical(@Param("editionId") editionId: string, @Body() body: { stock: number; reason: string }, @Req() req: { user: { sub: string; role: Role } }) { return this.service.adjustPhysical(editionId, body.stock, body.reason, req.user.sub, req.user.role); }
  @Patch(":editionId/digital") digital(@Param("editionId") editionId: string, @Body() body: { limit: number | null; reason: string }, @Req() req: { user: { sub: string; role: Role } }) { return this.service.setDigitalLimit(editionId, body.limit, body.reason, req.user.sub, req.user.role); }
}
