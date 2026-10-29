import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../identity/presentation/guards/jwt-auth.guard";
import { RolesGuard } from "../../identity/presentation/guards/roles.guard";
import { Roles } from "../../identity/presentation/decorators/roles.decorator";
import { Role } from "../../identity/domain/role.enum";
import { AuditService } from "../application/services/audit.service";

@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.auditService.listLogs({
      page: pageNum,
      limit: limitNum,
      action,
    });
  }
}
