import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../../identity/domain/role.enum.js";
import { AuditLogEntity, CreateAuditLogParams } from "../../domain/audit-log.entity.js";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: CreateAuditLogParams): Promise<void> {
    const auditEntity = new AuditLogEntity(params);

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: auditEntity.actorId,
          actorRole: auditEntity.actorRole as Role | null,
          action: auditEntity.action,
          targetType: auditEntity.targetType,
          targetId: auditEntity.targetId,
          reason: auditEntity.reason,
          metadata: auditEntity.metadata,
        },
      });
    } catch (error) {
      // Auditoria nunca deve quebrar silenciosamente, mas erro de log não deve expor PII
      console.error(
        `[AUDIT_ERROR] Failed to record audit log for action: ${params.action}`,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  async listLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
  }): Promise<{
    items: Array<{
      id: string;
      actorId: string | null;
      actorRole: string | null;
      action: string;
      targetType: string;
      targetId: string | null;
      reason: string | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where = params.action ? { action: params.action } : {};

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          targetType: true,
          targetId: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
