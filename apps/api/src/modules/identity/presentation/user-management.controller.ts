import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "../domain/role.enum";
import { AccountService } from "../application/services/account.service";
import { AuthService } from "../application/services/auth.service.js";
import { AuditService } from "../../audit/application/services/audit.service";
import { UpdateRoleDto, UpdateStatusDto } from "./dto/account.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserManagementController {
  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async listUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("role") role?: Role,
    @Query("search") search?: string,
    @Query("isActive") isActive?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    if (
      !Number.isSafeInteger(pageNum) ||
      pageNum < 1 ||
      !Number.isSafeInteger(limitNum) ||
      limitNum < 1
    ) {
      throw new BadRequestException("Paginação inválida.");
    }
    if (search && search.length > 254) {
      throw new BadRequestException(
        "Busca de e-mail excede o limite permitido.",
      );
    }
    if (role && !Object.values(Role).includes(role)) {
      throw new BadRequestException("Filtro de papel inválido.");
    }
    if (isActive !== undefined && isActive !== "true" && isActive !== "false") {
      throw new BadRequestException("Filtro de status inválido.");
    }

    return this.accountService.listUsers({
      page: pageNum,
      limit: limitNum,
      role,
      search,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
  }

  @Post("invitations")
  async createInvitation(
    @Body() dto: { email: string; role: Role; reason: string },
    @Req() req: { user: { sub: string; role: Role } },
  ) {
    if (
      !dto ||
      !dto.email?.trim() ||
      dto.email.trim().length > 254 ||
      !dto.reason?.trim() ||
      dto.reason.trim().length < 5 ||
      dto.reason.trim().length > 500
    ) {
      throw new BadRequestException(
        "E-mail e motivo (mínimo 5 caracteres) são obrigatórios.",
      );
    }
    const invitation = await this.authService.createStaffInvitation({
      email: dto.email,
      role: dto.role,
    });
    await this.auditService.logAction({
      actorId: req.user.sub,
      actorRole: req.user.role,
      action: "TEAM_INVITATION_CREATED",
      targetType: "USER",
      targetId: invitation.userId,
      reason: dto.reason,
      metadata: { role: invitation.role },
    });
    const webBaseUrl = (
      process.env.WEB_BASE_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    return {
      userId: invitation.userId,
      email: invitation.email,
      role: invitation.role,
      expiresInHours: 24,
      activationUrl: `${webBaseUrl}/ativar-equipe?token=${encodeURIComponent(invitation.token)}`,
    };
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
