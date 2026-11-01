import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "../domain/role.enum";
import { AccountService } from "../application/services/account.service";
import { AuditService } from "../../audit/application/services/audit.service";
import { UpdateRoleDto, UpdateStatusDto } from "./dto/account.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserManagementController {
  constructor(
    private readonly accountService: AccountService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async listUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("role") role?: Role,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.accountService.listUsers({
      page: pageNum,
      limit: limitNum,
      role,
    });
  }

  @Patch(":id/role")
  async updateUserRole(
    @Param("id") targetUserId: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: { user: { sub: string; role: Role } },
  ) {
    const actorId = req.user.sub;
    const updated = await this.accountService.updateUserRole(
      actorId,
      targetUserId,
      dto.role as Role,
      dto.reason,
    );

    // Registro de auditoria sensível com motivo obrigatório (RF-022 / RN-017)
    await this.auditService.logAction({
      actorId,
      actorRole: req.user.role,
      action: "USER_ROLE_UPDATED",
      targetType: "USER",
      targetId: targetUserId,
      reason: dto.reason,
      metadata: { newRole: dto.role },
    });

    return updated;
  }

  @Patch(":id/status")
  async updateUserStatus(
    @Param("id") targetUserId: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: { user: { sub: string; role: Role } },
  ) {
    const actorId = req.user.sub;
    const updated = await this.accountService.updateUserStatus(
      actorId,
      targetUserId,
      dto.isActive,
      dto.reason,
    );

    await this.auditService.logAction({
      actorId,
      actorRole: req.user.role,
      action: "USER_STATUS_UPDATED",
      targetType: "USER",
      targetId: targetUserId,
      reason: dto.reason,
      metadata: { newStatus: dto.isActive ? "ACTIVE" : "INACTIVE" },
    });

    return updated;
  }
}
