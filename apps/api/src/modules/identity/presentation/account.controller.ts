import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { AccountService } from "../application/services/account.service.js";
import { AuditService } from "../../audit/application/services/audit.service.js";
import { Role } from "../domain/role.enum.js";
import { DeactivateAccountDto } from "./dto/account.dto.js";

@Controller("account")
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly auditService: AuditService,
  ) {}

  @Post("deactivate-request")
  async requestDeactivation(
    @Body() dto: DeactivateAccountDto,
    @Req() req: { user: { sub: string; role: Role } },
  ) {
    const userId = req.user.sub;
    const reason = dto.reason || "Solicitação realizada pelo cliente";

    const result = await this.accountService.requestAccountDeletion(userId);

    // Auditoria de ação sensível
    await this.auditService.logAction({
      actorId: userId,
      actorRole: req.user.role,
      action: "ACCOUNT_DELETION_REQUESTED",
      targetType: "USER",
      targetId: userId,
      reason,
      metadata: { scheduledDeletionAt: result.scheduledDeletionAt.toISOString() },
    });

    return result;
  }

  @Post("reactivate")
  async reactivateAccount(@Req() req: { user: { sub: string; role: Role } }) {
    const userId = req.user.sub;
    const result = await this.accountService.reactivateAccount(userId);

    await this.auditService.logAction({
      actorId: userId,
      actorRole: req.user.role,
      action: "ACCOUNT_REACTIVATED",
      targetType: "USER",
      targetId: userId,
      reason: "Reativação efetuada pelo titular dentro do prazo de carência",
    });

    return result;
  }
}
