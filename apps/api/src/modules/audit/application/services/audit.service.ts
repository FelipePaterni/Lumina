import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../../identity/domain/role.enum.js";
import { AuditLogEntity, CreateAuditLogParams } from "../../domain/audit-log.entity.js";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

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
    } catch {
      this.logger.error(`audit persistence failed action=${params.action} code=AUDIT_STORAGE_FAILURE`);
    }
  }

  async logActionInTransaction(
    tx: Prisma.TransactionClient,
    params: CreateAuditLogParams,
  ): Promise<void> {
    const auditEntity = new AuditLogEntity(params);
    await tx.auditLog.create({
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
